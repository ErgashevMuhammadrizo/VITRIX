import json, re, secrets
from datetime import timedelta
from functools import wraps
from django.conf import settings
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db import transaction, IntegrityError
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from .models import EmailCode, AccountProfile, ensure_business

User = get_user_model()


def error(message, status=400):
    return JsonResponse({"detail": message}, status=status)


def payload(request):
    try:
        result = json.loads(request.body or "{}")
        if not isinstance(result, dict):
            raise ValueError()
        return result
    except (ValueError, UnicodeDecodeError):
        raise ValueError("So‘rov formati noto‘g‘ri.")


def account_ref(user_id):
    return f"VX-{int(user_id):06d}"


def identity(user):
    profile, _ = AccountProfile.objects.get_or_create(user=user)
    ensure_business(user)
    return {
        "id": str(user.pk),
        "firstName": user.first_name or user.username,
        "lastName": user.last_name,
        "email": user.email,
        "phone": profile.phone,
        "username": user.username,
        "role": "admin" if user.is_superuser else "user",
        "accountId": account_ref(user.pk),
        "active": user.is_active,
        "createdAt": user.date_joined.isoformat(),
        "trialStartedAt": profile.trial_started_at.isoformat(),
    }


def protected(admin=False):
    def decorate(fn):
        @wraps(fn)
        def wrapped(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return error("Hisobingizga kiring.", 401)
            if admin and not request.user.is_superuser:
                return error("Ruxsat yo‘q.", 403)
            return fn(request, *args, **kwargs)

        return wrapped

    return decorate


@require_http_methods(["GET"])
def csrf(request):
    return JsonResponse({"csrfToken": get_token(request)})


@require_http_methods(["GET"])
def me(request):
    if not request.user.is_authenticated:
        return error("Hisobingizga kiring.", 401)
    return JsonResponse({"user": identity(request.user)})


@require_http_methods(["POST"])
def sign_in(request):
    try:
        v = payload(request)
    except ValueError as exc:
        return error(str(exc))
    if not isinstance(v.get("username"), str) or not isinstance(v.get("password"), str):
        return error("Login va parolni kiriting.")
    identifier = str(v.get("username", "")).strip()
    matches = (
        User.objects.filter(email__iexact=identifier)
        if "@" in identifier
        else User.objects.filter(username__iexact=identifier)
    )
    existing = matches.first()
    username = existing.username if existing else identifier
    # Persistent per-session attempt counter; do not expose account existence.
    if (
        request.session.get("login_attempts", 0) >= 10
        and request.session.get("login_retry_after", 0) > timezone.now().timestamp()
    ):
        return error("Ko‘p urinish. 10 daqiqadan keyin qayta urining.", 429)
    user = authenticate(request, username=username, password=v.get("password", ""))
    if not user or not user.is_active:
        request.session["login_attempts"] = request.session.get("login_attempts", 0) + 1
        request.session["login_retry_after"] = (
            timezone.now() + timedelta(minutes=10)
        ).timestamp()
        return error("Login yoki parol noto‘g‘ri.", 401)
    login(request, user)
    request.session["login_attempts"] = 0
    request.session.set_expiry(30 * 86400 if v.get("remember") else 0)
    return JsonResponse({"user": identity(user)})


@require_http_methods(["POST"])
def sign_out(request):
    logout(request)
    return JsonResponse({"detail": "Hisobdan chiqildi."})


@require_http_methods(["POST"])
def request_code(request):
    try:
        v = payload(request)
        email = str(v.get("email", "")).strip().lower()
        validate_email(email)
    except (ValueError, ValidationError):
        return error("Email manzilini to‘g‘ri kiriting.")
    purpose = v.get("purpose", "register")
    if purpose not in ["register", "reset"]:
        return error("So‘rov turi noto‘g‘ri.")
    exists = User.objects.filter(email__iexact=email).exists()
    if purpose == "register" and exists:
        return error("Bu email bilan hisob mavjud. Kirish sahifasidan foydalaning.")
    if purpose == "reset" and not exists:
        return JsonResponse(
            {"detail": "Hisob mavjud bo‘lsa, kod yuboriladi.", "expiresIn": 600}
        )
    now = timezone.now()
    # Atomic per-email lock prevents rapid consecutive sends and OTP brute force reset.
    with transaction.atomic():
        code = (
            EmailCode.objects.select_for_update()
            .filter(email=email, purpose=purpose)
            .first()
        )
        if code and (now - code.sent_at).total_seconds() < 60:
            return error("Qayta yuborish uchun 60 soniya kuting.", 429)
        if code and code.attempts >= 5 and code.expires_at > now:
            return error("Urinishlar tugadi. 10 daqiqadan keyin qayta urining.", 429)
        value = f"{secrets.randbelow(1000000):06d}"
        EmailCode.objects.update_or_create(
            email=email,
            purpose=purpose,
            defaults={
                "digest": make_password(value),
                "expires_at": now + timedelta(minutes=10),
                "sent_at": now,
                "attempts": 0,
            },
        )
    try:
        if settings.EMAIL_BACKEND.endswith("smtp.EmailBackend") and (
            not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD
        ):
            raise RuntimeError("SMTP not configured")
        from .localization import translate
        from django.utils.translation import get_language
        lang = (get_language() or 'uz').split('-')[0]
        body = {'uz':f"Tasdiqlash kodingiz: {value}\nKod 10 daqiqa amal qiladi. Kodni hech kimga bermang.\nVITRIX — DEALS loyihasi",'ru':f"Ваш код подтверждения: {value}\nКод действует 10 минут. Никому его не сообщайте.\nVITRIX — проект DEALS",'en':f"Your verification code: {value}\nThe code is valid for 10 minutes. Do not share it.\nVITRIX — a DEALS project"}
        send_mail(
            translate("VITRIX — tasdiqlash kodi"),
            body.get(lang,body["uz"]),
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
    except Exception:
        EmailCode.objects.filter(
            email=email, purpose=purpose, digest__isnull=False
        ).delete()
        return error(
            "Xat yuborilmadi. Email xizmatini sozlash yoki keyinroq qayta urinish kerak.",
            503,
        )
    return JsonResponse(
        {"detail": "Tasdiqlash kodi emailingizga yuborildi.", "expiresIn": 600}
    )


def consume_code(email, purpose, value):
    code = (
        EmailCode.objects.select_for_update()
        .filter(email=email, purpose=purpose)
        .first()
    )
    if not code or code.expires_at <= timezone.now():
        return "Kod muddati tugagan. Yangi kod oling."
    if code.attempts >= 5:
        return "Urinishlar tugagan. Yangi kodni keyinroq so‘rang."
    code.attempts += 1
    code.save(update_fields=["attempts"])
    if not re.fullmatch(r"\d{6}", str(value)) or not check_password(
        str(value), code.digest
    ):
        return "Tasdiqlash kodi noto‘g‘ri."
    return code


@require_http_methods(["POST"])
def register(request):
    try:
        v = payload(request)
    except ValueError as exc:
        return error(str(exc))
    if any(
        not isinstance(v.get(field), str)
        for field in ["firstName", "lastName", "email", "username", "phone", "password"]
    ):
        return error("Ro‘yxatdan o‘tish ma’lumotlarini tekshiring.")
    email = str(v.get("email", "")).strip().lower()
    username = str(v.get("username", "")).strip()
    password = v.get("password", "")
    try:
        validate_email(email)
        if not re.fullmatch(r"[A-Za-z0-9_]{3,30}", username):
            raise ValidationError(
                "Username 3–30 ta harf, raqam yoki _ dan iborat bo‘lsin."
            )
        if (
            len(str(v.get("firstName", "")).strip()) < 2
            or len(str(v.get("lastName", "")).strip()) < 2
        ):
            raise ValidationError("Ism va familiyani kiriting.")
        if not re.fullmatch(r"\+?[0-9\s-]{9,17}", str(v.get("phone", ""))):
            raise ValidationError("Telefon raqamini tekshiring.")
        if v.get("terms") is not True:
            raise ValidationError("Foydalanish shartlariga rozilik kerak.")
        validate_password(password, User(username=username, email=email))
    except ValidationError as exc:
        return error(" ".join(exc.messages))
    if (
        User.objects.filter(email__iexact=email).exists()
        or User.objects.filter(username__iexact=username).exists()
    ):
        return error("Email yoki username band.")
    try:
        with transaction.atomic():
            verified = consume_code(email, "register", v.get("code", ""))
            if isinstance(verified, str):
                return error(verified)
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=v["firstName"].strip(),
                last_name=v["lastName"].strip(),
            )
            AccountProfile.objects.create(user=user, phone=v["phone"])
            verified.delete()
    except IntegrityError:
        return error("Email yoki username band.")
    login(request, user)
    request.session.set_expiry(0)
    return JsonResponse({"user": identity(user)}, status=201)


@require_http_methods(["POST"])
def reset_password(request):
    try:
        v = payload(request)
    except ValueError as exc:
        return error(str(exc))
    email = str(v.get("email", "")).strip().lower()
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return error("Kod yoki email noto‘g‘ri.")
    try:
        validate_password(v.get("password", ""), user)
    except ValidationError as exc:
        return error(" ".join(exc.messages))
    with transaction.atomic():
        verified = consume_code(email, "reset", v.get("code", ""))
        if isinstance(verified, str):
            return error(verified)
        user.set_password(v["password"])
        user.save(update_fields=["password"])
        verified.delete()
    return JsonResponse({"detail": "Parol yangilandi. Endi hisobingizga kiring."})


@require_http_methods(["GET", "PATCH"])
@protected()
def profile(request):
    if request.method == "GET":
        return JsonResponse({"user": identity(request.user)})
    try:
        v = payload(request)
    except ValueError as exc:
        return error(str(exc))
    user = request.user
    # Email changes must go through a verification flow, so this endpoint does not change email.
    user.first_name = str(v.get("firstName", user.first_name)).strip()
    user.last_name = str(v.get("lastName", user.last_name)).strip()
    user.save(update_fields=["first_name", "last_name"])
    p, _ = AccountProfile.objects.get_or_create(user=user)
    p.phone = str(v.get("phone", p.phone))
    p.save(update_fields=["phone"])
    return JsonResponse({"user": identity(user)})


@require_http_methods(["GET"])
@protected(admin=True)
def users(request):
    return JsonResponse(
        {"users": [identity(u) for u in User.objects.order_by("-date_joined")]}
    )


@require_http_methods(["PATCH", "DELETE"])
@protected(admin=True)
def user_detail(request, user_id):
    user = User.objects.filter(pk=user_id).first()
    if not user:
        return error("Hisob topilmadi.", 404)
    if user.pk == request.user.pk:
        return error("O‘z hisobingizni bu yerdan o‘zgartira olmaysiz.")
    if user.is_superuser:
        return error("Boshqa superadmin hisobini Django admin orqali boshqaring.", 403)
    if request.method == "DELETE":
        user.delete()
        return JsonResponse({"detail": "Hisob o‘chirildi."})
    try:
        v = payload(request)
    except ValueError as exc:
        return error(str(exc))
    if not isinstance(v.get("active"), bool):
        return error("Holatni tekshiring.")
    user.is_active = v["active"]
    user.save(update_fields=["is_active"])
    return JsonResponse({"user": identity(user)})


def csrf_failure(request, reason=""):
    return error(
        "Sessiya xavfsizlik tekshiruvi o‘tmadi. Sahifani yangilang va qayta urinib ko‘ring.",
        403,
    )


@require_http_methods(["GET"])
def health(request):
    from django.db import connection

    try:
        connection.ensure_connection()
        from .models import Plan

        if not Plan.objects.filter(pk="starter").exists():
            return error("Migrations required.", 503)
    except Exception:
        return error("Database unavailable.", 503)
    return JsonResponse({"status": "ok"})
