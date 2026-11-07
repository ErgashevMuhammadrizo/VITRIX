import base64, io, uuid, re, json
from datetime import timedelta
from PIL import Image, UnidentifiedImageError
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError, connection
from django.db.models import F, Count, Q
from .security import allow, client_ip
from .uploads import staged, staged_uploads
from .catalogue import (
    analytics,
    page,
    public_business_record,
    published_products,
    product_public,
    DESIGN_FIELDS,
)
from .models import DesignVersion, SlugRedirect
from django.db.models.deletion import ProtectedError
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from .models import (
    Plan,
    Business,
    Category,
    Product,
    Event,
    Activity,
    PlatformSettings,
    SubscriptionRequest,
    AuditLog,
    SubscriptionActivation,
    ensure_business,
)
from .views import protected, error, payload, identity, User, account_ref

BUSINESS_FIELDS = [
    "name",
    "slug",
    "description",
    "phone",
    "telegram",
    "address",
    "hours",
    "instagram",
    "language",
    "logo",
    "cover",
    "active",
    "theme",
    "primary",
    "secondary",
    "font",
    "layout",
    "card",
    "header",
    "buttons",
]
BUSINESS_FIELDS += [
    "colorMode",
    "backgroundColor",
    "surfaceColor",
    "textColor",
    "surfaceTextColor",
    "mutedColor",
    "heroStyle",
    "heroTitle",
    "contentWidth",
    "productColumns",
    "mobileColumns",
    "cornerStyle",
    "density",
    "showHero",
    "showSearch",
    "showCategories",
    "showPrices",
    "showContacts",
    "showLocation",
    "latitude",
    "longitude",
    "mapUrl",
]
PLATFORM_FIELDS = [
    "name",
    "email",
    "phone",
    "description",
    "logo",
    "subscriptionTelegram",
]
BUSINESS_FIELDS += ["translations"]
CATEGORY_FIELDS = ["translations", "name", "description", "image", "order", "active"]
PRODUCT_FIELDS = [
    "translations",
    "name",
    "slug",
    "image",
    "images",
    "price",
    "oldPrice",
    "description",
    "shortDescription",
    "availability",
    "featured",
    "order",
    "status",
]
PLAN_FIELDS = [
    "name",
    "price",
    "duration",
    "limit",
    "features",
    "analyticsDays",
    "csvExport",
]


def record(obj, fields):
    return {
        "revision": obj.revision,
        **{field: getattr(obj, field) for field in fields},
    }


def business_record(b):
    return {
        "id": str(b.pk),
        "ownerId": str(b.owner_id),
        "accountId": account_ref(b.owner_id),
        "ownerEmail": b.owner.email,
        "pendingPlanId": b.subscriptionrequest_set.filter(status="pending")
        .values_list("plan_id", flat=True)
        .first(),
        **record(b, BUSINESS_FIELDS),
        "latitude": float(b.latitude) if b.latitude is not None else None,
        "longitude": float(b.longitude) if b.longitude is not None else None,
        "planId": b.plan_id,
        "expires": b.expires.isoformat(),
        "trialStartedAt": b.trialStartedAt.isoformat(),
        "createdAt": b.createdAt.isoformat(),
    }


def category_record(c):
    return {
        "id": str(c.pk),
        "businessId": str(c.business_id),
        "productCount": getattr(c, "productCount", 0),
        **record(c, CATEGORY_FIELDS),
    }


def product_record(p):
    return {
        "id": str(p.pk),
        "businessId": str(p.business_id),
        "categoryId": str(p.category_id or ""),
        **record(p, PRODUCT_FIELDS),
        "price": float(p.price),
        "oldPrice": float(p.oldPrice),
    }


def platform_record(platform):
    from django.conf import settings

    value = record(platform, PLATFORM_FIELDS)
    value["subscriptionTelegram"] = (
        (platform.subscriptionTelegram or settings.SUBSCRIPTION_TELEGRAM)
        .strip()
        .removeprefix("@")
    )
    return value


def snapshot(user, metadata=False):
    businesses = (
        Business.objects.select_related("plan", "owner").order_by("id")[:50]
        if user.is_superuser
        else Business.objects.select_related("plan", "owner").filter(owner=user)
    )
    businesses = list(businesses)
    ids = [b.pk for b in businesses]
    product_counts = {
        str(r["business_id"]): r
        for r in Product.objects.filter(business_id__in=ids)
        .values("business_id")
        .annotate(
            total=Count("id"), published=Count("id", filter=Q(status="published"))
        )
    }
    category_counts = {
        str(r["business_id"]): r["total"]
        for r in Category.objects.filter(business_id__in=ids)
        .values("business_id")
        .annotate(total=Count("id"))
    }
    meta = {
        "analytics": (
            {} if user.is_superuser else {str(b.pk): analytics(b) for b in businesses}
        ),
        "counts": {
            str(b.pk): {
                "products": product_counts.get(str(b.pk), {}).get("total", 0),
                "published": product_counts.get(str(b.pk), {}).get("published", 0),
                "categories": category_counts.get(str(b.pk), 0),
            }
            for b in businesses
        },
        "collections": {
            "products": Product.objects.filter(business_id__in=ids).count(),
            "categories": Category.objects.filter(business_id__in=ids).count(),
            "businesses": (
                Business.objects.count() if user.is_superuser else len(businesses)
            ),
            "users": User.objects.count() if user.is_superuser else 1,
            "activeBusinesses": (
                Business.objects.filter(
                    active=True, owner__is_active=True, expires__gt=timezone.now()
                ).count()
                if user.is_superuser
                else sum(b.active and b.expires > timezone.now() for b in businesses)
            ),
        },
    }
    if metadata:
        return meta
    platform, _ = PlatformSettings.objects.get_or_create(pk=1)
    return {
        "version": 1,
        "pricingVersion": 2,
        "users": [
            identity(u)
            for u in (User.objects.order_by("pk")[:50] if user.is_superuser else [user])
        ],
        "businesses": [business_record(b) for b in businesses],
        "categories": [
            category_record(c)
            for c in Category.objects.filter(business_id__in=ids)
            .annotate(productCount=Count("product"))
            .order_by("order", "id")[:50]
        ],
        "products": [
            product_record(p)
            for p in Product.objects.filter(business_id__in=ids).order_by(
                "order", "id"
            )[:50]
        ],
        "plans": [
            {"id": p.pk, **record(p, PLAN_FIELDS)}
            for p in Plan.objects.order_by("price")
        ],
        "events": [],
        **meta,
        "activities": [
            {
                "id": str(a.pk),
                "businessId": a.business_id,
                "text": a.text,
                "at": a.at.isoformat(),
            }
            for a in Activity.objects.filter(business_id__in=ids).order_by("-at")[:100]
        ],
        "subscriptionRequests": [
            {
                "id": str(r.pk),
                "businessId": r.business_id,
                "planId": r.plan_id,
                "status": r.status,
                "createdAt": r.createdAt.isoformat(),
            }
            for r in SubscriptionRequest.objects.filter(business_id__in=ids).order_by(
                "-createdAt"
            )[:100]
        ],
        "subscriptionActivations": (
            [
                {
                    "id": str(a.pk),
                    "businessId": a.business_id,
                    "planId": a.plan_id,
                    "months": a.months,
                    "mode": a.mode,
                    "note": a.note,
                    "previousExpiry": a.previousExpiry.isoformat(),
                    "newExpiry": a.newExpiry.isoformat(),
                    "actor": a.actor.username if a.actor else "",
                    "createdAt": a.createdAt.isoformat(),
                }
                for a in SubscriptionActivation.objects.select_related(
                    "actor"
                ).order_by("-createdAt")[:100]
            ]
            if user.is_superuser
            else []
        ),
        "platform": platform_record(platform),
    }


def image_url(value):
    if not value:
        return ""
    if not isinstance(value, str):
        raise ValidationError("Rasm formati noto‘g‘ri.")
    if not value.startswith("data:"):
        if (
            value.startswith("/media/")
            or value.startswith("/images/")
            or value.startswith("https://")
        ):
            return value
        raise ValidationError("Rasm havolasi noto‘g‘ri.")
    try:
        header, data = value.split(",", 1)
        if header not in [
            "data:image/jpeg;base64",
            "data:image/png;base64",
            "data:image/webp;base64",
        ]:
            raise ValueError()
        raw = base64.b64decode(data, validate=True)
        if len(raw) > 2 * 1024 * 1024:
            raise ValueError()
        image = Image.open(io.BytesIO(raw), formats=["JPEG", "PNG", "WEBP"])
        image.verify()
        if image.format not in ["JPEG", "PNG", "WEBP"]:
            raise ValueError()
        if image.width * image.height > 25000000:
            raise ValueError()
        from PIL import ImageOps

        source = ImageOps.exif_transpose(
            Image.open(io.BytesIO(raw), formats=["JPEG", "PNG", "WEBP"])
        )
        image = Image.new("RGB", source.size, "white")
        if source.mode in ["RGBA", "LA"]:
            image.paste(source.convert("RGB"), mask=source.getchannel("A"))
        else:
            image.paste(source.convert("RGB"))
        image.thumbnail((1600, 1600))
        output = io.BytesIO()
        image.save(output, format="WEBP", quality=85, method=4)
        raw = output.getvalue()
        extension = "webp"
    except (ValueError, UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise ValidationError("JPG, PNG yoki WebP rasm 2 MB dan oshmasin.")
    path = default_storage.save(
        "uploads/" + uuid.uuid4().hex + "." + extension, ContentFile(raw)
    )
    if staged.get() is not None:
        staged.get().append(path)
    return "/media/" + path


def assign(obj, data, fields):
    for field in fields:
        if field not in data:
            continue
        value = data[field]
        if field == "translations":
            allowed = {
                Business: {
                    "name": 100,
                    "description": 2000,
                    "address": 300,
                    "hours": 120,
                    "heroTitle": 140,
                },
                Product: {"name": 100, "description": 4000, "shortDescription": 180},
                Category: {"name": 80, "description": 500},
            }.get(type(obj), {})
            if not isinstance(value, dict) or any(
                lang not in ["uz", "ru", "en"]
                or not isinstance(content, dict)
                or any(
                    key not in allowed
                    or not isinstance(text, str)
                    or len(text) > allowed[key]
                    for key, text in content.items()
                )
                for lang, content in value.items()
            ):
                raise ValidationError("Tarjima maydonlarini tekshiring.")
        if field in ["logo", "cover", "image"]:
            value = image_url(value)
        if field == "images":
            if not isinstance(value, list) or len(value) > 3:
                raise ValidationError("Ko‘pi bilan 3 ta qo‘shimcha rasm.")
            value = [image_url(v) for v in value]
        if (
            field in ["active", "featured", "csvExport"] or field.startswith("show")
        ) and not isinstance(value, bool):
            raise ValidationError("Holat qiymati noto‘g‘ri.")
        if field in ["latitude", "longitude"] and value == "":
            value = None
        if field in ["latitude", "longitude"] and value is not None:
            from decimal import Decimal, InvalidOperation

            try:
                value = Decimal(str(value))
            except InvalidOperation:
                raise ValidationError("Koordinatalar raqam bo‘lishi kerak.")
        if field == "subscriptionTelegram" and isinstance(value, str):
            value = value.strip().removeprefix("@")
        setattr(obj, field, value)
    obj.full_clean()
    obj.revision += 1 if not obj._state.adding else 0
    obj.save()


def check_business(user, business_id, write=True):
    query = (
        Business.objects.select_for_update()
        if connection.in_atomic_block
        else Business.objects
    )
    b = query.select_related("plan").filter(pk=business_id).first()
    if not b or (not user.is_superuser and b.owner_id != user.pk):
        raise PermissionError("Bu biznesga ruxsat yo‘q.")
    if write and not user.is_superuser and b.expires <= timezone.now():
        raise PermissionError("Obuna muddati tugagan. Pro yoki VIP tarifini tanlang.")
    return b


class RevisionConflict(Exception):
    pass


def check_revision(obj, change):
    if obj and (
        type(change.get("revision")) is not int or change["revision"] != obj.revision
    ):
        raise RevisionConflict()


@require_http_methods(["GET", "PATCH"])
@protected()
@staged_uploads
def workspace(request):
    ensure_business(request.user)
    if request.method == "GET":
        return JsonResponse(
            snapshot(request.user, metadata=request.GET.get("view") == "summary")
        )
    try:
        v = payload(request)
        changes = v.get("changes")
        if not isinstance(changes, list) or len(changes) > 100:
            raise ValidationError("O‘zgarishlar formati noto‘g‘ri.")
        acknowledged = []
        deleted = []
        with transaction.atomic():
            for change in changes:
                if not isinstance(change, dict):
                    raise ValidationError("O‘zgarish formati noto‘g‘ri.")
                entity = change.get("entity")
                operation = change.get("op")
                data = change.get("record", {})
                if not isinstance(data, dict):
                    raise ValidationError("Yozuv formati noto‘g‘ri.")
                key = str(data.get("id") or change.get("id") or "")
                if operation not in ["upsert", "delete"] or not key or len(key) > 64:
                    raise ValidationError("Amal yoki ID noto‘g‘ri.")
                if entity == "businesses":
                    b = check_business(request.user, key, write=False)
                    check_revision(b, change)
                    old_slug = b.slug
                    old_design = {k: getattr(b, k) for k in DESIGN_FIELDS}
                    if operation == "delete":
                        if not request.user.is_superuser:
                            raise PermissionError("Biznesni faqat admin o‘chiradi.")
                        b.delete()
                        deleted.append({"entity": entity, "id": key})
                        continue
                    if not request.user.is_superuser:
                        if any(
                            k in data and data[k] != business_record(b).get(k)
                            for k in ["ownerId", "planId", "expires", "trialStartedAt"]
                        ):
                            raise PermissionError(
                                "Obunani faqat administrator o‘zgartiradi."
                            )
                        check_business(request.user, key)
                    if request.user.is_superuser and any(
                        k in data and data[k] != business_record(b).get(k)
                        for k in ["planId", "expires", "trialStartedAt", "ownerId"]
                    ):
                        raise ValidationError(
                            "Obunani maxsus faollashtirish tugmasi orqali o‘zgartiring."
                        )
                    assign(b, data, BUSINESS_FIELDS)
                    if old_slug != b.slug:
                        SlugRedirect.objects.get_or_create(
                            slug=old_slug, defaults={"business": b}
                        )
                    new_design = {k: getattr(b, k) for k in DESIGN_FIELDS}
                    if old_design != new_design:
                        if not b.design_versions.exists():
                            DesignVersion.objects.create(
                                business=b, design=old_design, actor=request.user
                            )
                        DesignVersion.objects.create(
                            business=b, design=new_design, actor=request.user
                        )
                    acknowledged.append(
                        {"entity": entity, "record": business_record(b)}
                    )
                elif entity in ["products", "categories"]:
                    model = Product if entity == "products" else Category
                    obj = model.objects.select_for_update().filter(pk=key).first()
                    business_id = obj.business_id if obj else data.get("businessId")
                    b = check_business(request.user, business_id)
                    check_revision(obj, change)
                    if obj and data.get("businessId", business_id) != business_id:
                        raise PermissionError("Biznesni almashtirib bo‘lmaydi.")
                    if operation == "delete":
                        if obj:
                            obj.delete()
                            deleted.append({"entity": entity, "id": key})
                    else:
                        if not obj:
                            if (
                                entity == "products"
                                and b.plan.limit is not None
                                and b.products.count() >= b.plan.limit
                            ):
                                raise ValidationError(
                                    "Tarifdagi mahsulotlar limiti tugadi."
                                )
                            obj = model(id=key, business=b)
                        if entity == "products" and "categoryId" in data:
                            obj.category_id = data.get("categoryId") or None
                        assign(
                            obj,
                            data,
                            PRODUCT_FIELDS if entity == "products" else CATEGORY_FIELDS,
                        )
                        acknowledged.append(
                            {
                                "entity": entity,
                                "record": (
                                    product_record(obj)
                                    if entity == "products"
                                    else category_record(obj)
                                ),
                            }
                        )
                    Activity.objects.create(
                        business=b,
                        text=(
                            str(data.get("name", "Katalog"))[:100]
                            + " "
                            + ("o‘chirildi" if operation == "delete" else "saqlandi")
                        ),
                    )
                elif entity == "plans":
                    if not request.user.is_superuser:
                        raise PermissionError("Tariflarni faqat admin boshqaradi.")
                    obj = Plan.objects.select_for_update().filter(pk=key).first()
                    check_revision(obj, change)
                    if operation == "delete":
                        if key in ["starter", "pro", "vip"]:
                            raise ValidationError(
                                "Asosiy tariflarni o‘chirib bo‘lmaydi."
                            )
                        if obj:
                            obj.delete()
                    else:
                        obj = obj or Plan(id=key)
                        assign(obj, data, PLAN_FIELDS)
                        acknowledged.append(
                            {
                                "entity": entity,
                                "record": {"id": obj.pk, **record(obj, PLAN_FIELDS)},
                            }
                        )
                elif entity == "platform":
                    if not request.user.is_superuser:
                        raise PermissionError(
                            "Platforma sozlamalarini faqat admin boshqaradi."
                        )
                    platform, _ = PlatformSettings.objects.get_or_create(pk=1)
                    check_revision(platform, change)
                    assign(
                        platform,
                        data,
                        PLATFORM_FIELDS,
                    )
                    acknowledged.append(
                        {"entity": entity, "record": platform_record(platform)}
                    )
                else:
                    raise ValidationError(
                        "Bunday ma’lumot turini o‘zgartirib bo‘lmaydi."
                    )
                AuditLog.objects.create(
                    actor=request.user, action=entity + ":" + operation, target=key
                )
    except RevisionConflict:
        return error(
            "Bu yozuv boshqa oynada o‘zgargan. Yangilang va qayta saqlang.", 409
        )
    except PermissionError as exc:
        return error(str(exc), 403)
    except (
        ValueError,
        TypeError,
        ValidationError,
        IntegrityError,
        ProtectedError,
    ) as exc:
        return error(
            " ".join(exc.messages)
            if isinstance(exc, ValidationError)
            else "Ma’lumotlarni tekshiring. Bu yozuv band yoki boshqa yozuvlarga bog‘langan."
        )
    return JsonResponse({"acknowledged": acknowledged, "deleted": deleted})


@require_http_methods(["GET"])
@protected()
def plans(request):
    return JsonResponse(
        {
            "plans": [
                {"id": p.pk, **record(p, PLAN_FIELDS)}
                for p in Plan.objects.order_by("price")
            ]
        }
    )


@require_http_methods(["GET"])
def public_business(request, slug):
    b = (
        Business.objects.select_related("owner", "plan")
        .filter(slug=slug, active=True, owner__is_active=True)
        .first()
    )
    if not b:
        old = SlugRedirect.objects.select_related("business").filter(slug=slug).first()
        if old:
            return JsonResponse({"redirect": old.business.slug})
        return error("Sayt topilmadi.", 404)
    if b.expires <= timezone.now():
        return error("Sayt obunasi vaqtincha faol emas.", 410)
    try:
        query = published_products(b)
        if request.GET.get("q"):
            query = query.filter(
                Q(name__icontains=request.GET["q"][:100])
                | Q(translations__icontains=request.GET["q"][:100])
            )
        if request.GET.get("category"):
            query = query.filter(category_id=request.GET["category"])
        if request.GET.get("product"):
            query = query.filter(slug=request.GET["product"])
        result = page(query, request, lambda p: product_public(p, b), key="products")
        cats = b.categories.filter(active=True).order_by("order", "id")
        try:
            category_page = max(1, int(request.GET.get("categoryPage", 1)))
            if category_page > 1000000:
                raise ValueError()
        except ValueError:
            raise ValueError()
        result.update(
            {
                "business": public_business_record(b),
                "categories": [
                    {
                        k: v
                        for k, v in category_record(c).items()
                        if k not in ["revision", "productCount"]
                    }
                    for c in (
                        cats[(category_page - 1) * 100 : category_page * 100]
                        if (category_page - 1) * 100 < cats.count()
                        else []
                    )
                ],
                "categoryPagination": {
                    "page": category_page,
                    "hasMore": category_page * 100 < cats.count(),
                    "total": cats.count(),
                },
            }
        )
        return JsonResponse(result)
    except ValueError:
        return error("Sahifa raqamini tekshiring.")


@require_http_methods(["POST"])
def track_event(request, slug):
    b = Business.objects.filter(
        slug=slug, active=True, owner__is_active=True, expires__gt=timezone.now()
    ).first()
    if not b:
        return error("Sayt topilmadi.", 404)
    try:
        v = payload(request)
    except ValueError:
        return error("So‘rov noto‘g‘ri.")
    if v.get("kind") not in ["visit", "phone", "telegram"]:
        return error("Hodisa turi noto‘g‘ri.")
    if not allow("events:ip", client_ip(request), 120, 60) or not allow(
        "events:business", b.pk, 3000, 60
    ):
        return error("Ko‘p urinish. Keyinroq qayta urining.", 429)
    # Keep duplicate browser visits/clicks in a 10-second window from inflating analytics.
    key = "event:" + str(b.pk) + ":" + v["kind"]
    now = timezone.now().timestamp()
    if request.session.get(key, 0) < now - 10:
        Event.objects.create(business=b, kind=v["kind"])
        request.session[key] = now
    return JsonResponse({"ok": True})


@require_http_methods(["POST"])
@protected()
def subscription_request(request):
    try:
        v = payload(request)
    except ValueError:
        return error("So‘rov noto‘g‘ri.")
    b = ensure_business(request.user)
    p = Plan.objects.filter(pk=v.get("planId")).first()
    if not b or not p or p.price <= 0:
        return error("Pro yoki VIP tarifini tanlang.")
    existing = SubscriptionRequest.objects.filter(business=b, status="pending").first()
    if existing:
        return error("Oldingi arizangiz hali ko‘rib chiqilmoqda.")
    try:
        SubscriptionRequest.objects.create(business=b, plan=p)
    except IntegrityError:
        return error("Oldingi arizangiz hali ko‘rib chiqilmoqda.")
    return JsonResponse(snapshot(request.user), status=201)


@require_http_methods(["POST"])
@protected(admin=True)
def review_subscription(request, request_id):
    try:
        v = payload(request)
    except ValueError:
        return error("So‘rov noto‘g‘ri.")
    with transaction.atomic():
        r = (
            SubscriptionRequest.objects.select_for_update()
            .select_related("plan", "business")
            .filter(pk=request_id)
            .first()
        )
        if not r:
            return error("Ariza topilmadi.", 404)
        if r.status != "pending":
            return error("Ariza allaqachon ko‘rib chiqilgan.")
        if v.get("approve") is True:
            b = r.business
            b.plan = r.plan
            b.expires = max(b.expires, timezone.now()) + timedelta(days=r.plan.duration)
            b.revision += 1
            b.save(update_fields=["plan", "expires", "revision"])
            r.status = "approved"
        elif v.get("approve") is False:
            r.status = "rejected"
        else:
            return error("Qarorni tanlang.")
        r.reviewedBy = request.user
        r.save()
        AuditLog.objects.create(
            actor=request.user, action="subscription:" + r.status, target=r.pk
        )
    return JsonResponse(snapshot(request.user))


@require_http_methods(["GET"])
def public_config(request):
    platform, _ = PlatformSettings.objects.get_or_create(pk=1)
    return JsonResponse(
        {
            "platform": platform_record(platform),
            "plans": [],
        }
    )


@require_http_methods(["POST"])
@protected()
def telegram_subscription(request):
    from django.conf import settings
    from urllib.parse import urlencode

    try:
        v = payload(request)
        plan = Plan.objects.filter(pk=v.get("planId"), price__gt=0).first()
        if not plan or request.user.is_superuser:
            return error("Pro yoki VIP tarifini tanlang.")
        platform, _ = PlatformSettings.objects.get_or_create(pk=1)
        operator = (
            (platform.subscriptionTelegram or settings.SUBSCRIPTION_TELEGRAM)
            .strip()
            .removeprefix("@")
        )
        if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]{3,31}", operator):
            return error("Administrator Telegram manzilini hali sozlamagan.", 503)
        with transaction.atomic():
            b = ensure_business(request.user)
            b = Business.objects.select_for_update().get(pk=b.pk)
            r = SubscriptionRequest.objects.filter(business=b, status="pending").first()
            if r:
                r.plan = plan
                r.save(update_fields=["plan"])
            else:
                SubscriptionRequest.objects.create(business=b, plan=plan)
        from django.utils.translation import get_language

        lang = (get_language() or "uz").split("-")[0]
        wording = {
            "uz": [
                "Salom, men saytimga obuna aktivlashtirmoqchi edim.",
                "Akkaunt ID",
                "Do‘kon",
                "Sayt",
                "Tarif",
                "Muddat: 1 oy (30 kun)",
                "Narx",
                "so‘m",
            ],
            "ru": [
                "Здравствуйте! Хочу активировать подписку для своего сайта.",
                "ID аккаунта",
                "Магазин",
                "Сайт",
                "Тариф",
                "Срок: 1 месяц (30 дней)",
                "Цена",
                "сум",
            ],
            "en": [
                "Hello! I would like to activate a subscription for my website.",
                "Account ID",
                "Shop",
                "Website",
                "Plan",
                "Period: 1 month (30 days)",
                "Price",
                "UZS",
            ],
        }.get(lang)
        if not wording:
            wording = [
                "Salom, men saytimga obuna aktivlashtirmoqchi edim.",
                "Akkaunt ID",
                "Do‘kon",
                "Sayt",
                "Tarif",
                "Muddat: 1 oy (30 kun)",
                "Narx",
                "so‘m",
            ]
        url = settings.FRONTEND_URL.rstrip("/") + "/" + b.slug
        price = f"{plan.price:,}".replace(",", " ")
        message = f"{wording[0]}\n\n{wording[1]}: {account_ref(request.user.pk)}\n{wording[2]}: {b.name}\n{wording[3]}: {url}\n{wording[4]}: {plan.name}\n{wording[5]}\n{wording[6]}: {price} {wording[7]}"
        return JsonResponse(
            {"url": "https://t.me/" + operator + "?" + urlencode({"text": message})}
        )
    except (ValueError, TypeError, IntegrityError):
        return error("So‘rovni tekshirib qayta urinib ko‘ring.")


@require_http_methods(["POST"])
@protected(admin=True)
def activate_subscription(request, business_id):
    try:
        v = payload(request)
        key = uuid.UUID(str(v.get("idempotencyKey", "")))
        months = v.get("months", 1)
        mode = v.get("mode", "extend")
        note = v.get("note", "")
        if (
            type(months) is not int
            or months not in [1, 3, 6, 12]
            or mode not in ["extend", "restart"]
            or not isinstance(note, str)
            or len(note) > 300
        ):
            return error("Muddat va izohni tekshiring.")
        with transaction.atomic():
            b = Business.objects.select_for_update().filter(pk=business_id).first()
            plan = Plan.objects.filter(pk=v.get("planId"), price__gt=0).first()
            if not b:
                return error("Biznes topilmadi.", 404)
            if not plan:
                return error("Pullik tarifni tanlang.")
            previous = SubscriptionActivation.objects.filter(idempotencyKey=key).first()
            if previous:
                if (
                    str(previous.business_id) != str(b.pk)
                    or previous.plan_id != plan.pk
                    or previous.months != months
                    or previous.mode != mode
                    or previous.note != note
                ):
                    return error("Bu amal kaliti boshqa so‘rov uchun ishlatilgan.", 409)
                return JsonResponse(snapshot(request.user))
            old = b.expires
            b.plan = plan
            b.expires = (
                max(old, timezone.now()) if mode == "extend" else timezone.now()
            ) + timedelta(days=30 * months)
            b.revision += 1
            b.save(update_fields=["plan", "expires", "revision"])
            SubscriptionActivation.objects.create(
                business=b,
                plan=plan,
                months=months,
                mode=mode,
                note=note,
                previousExpiry=old,
                newExpiry=b.expires,
                actor=request.user,
                idempotencyKey=key,
            )
            SubscriptionRequest.objects.filter(business=b, status="pending").update(
                status="approved", reviewedBy=request.user
            )
            AuditLog.objects.create(
                actor=request.user, action="subscription:activate", target=b.pk
            )
        return JsonResponse(snapshot(request.user))
    except (ValueError, TypeError, IntegrityError):
        return error("Amal kaliti yoki so‘rov noto‘g‘ri. Qayta urinib ko‘ring.")
