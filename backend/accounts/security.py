"""Database-backed abuse limits and atomic workspace write serialization."""
from functools import wraps
from datetime import timedelta
from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.http import JsonResponse
from django.utils import timezone
from django.utils.crypto import salted_hmac
from .models import SecurityBucket, WorkspaceLock


def client_address(request):
    # Forwarded headers are never trusted without an authenticated internal proxy.
    import secrets
    secret = settings.INTERNAL_PROXY_TOKEN
    if secret and secrets.compare_digest(request.headers.get("X-Vitrix-Proxy-Token", "").encode(), secret.encode()):
        return request.headers.get("X-Vitrix-Client-IP") or request.META.get("REMOTE_ADDR", "unknown")
    return request.META.get("REMOTE_ADDR", "unknown")


def allow(scope, identity, limit, seconds):
    key = salted_hmac("abuse", scope + ":" + str(identity)).hexdigest()
    now = timezone.now()
    with transaction.atomic():
        # A write before reading also serializes SQLite workers (select_for_update is a no-op there).
        SecurityBucket.objects.get_or_create(key=key, defaults={"expires_at": now + timedelta(seconds=seconds)})
        SecurityBucket.objects.filter(pk=key, expires_at__lte=now).update(count=0, expires_at=now + timedelta(seconds=seconds))
        return bool(SecurityBucket.objects.filter(pk=key, count__lt=limit).update(count=F("count") + 1))


def rate_limit(scope, limit, seconds):
    def decorate(fn):
        @wraps(fn)
        def wrapped(request, *args, **kwargs):
            if not allow(scope, client_address(request), limit, seconds):
                response = JsonResponse({"detail": "Ko‘p urinish. Keyinroq qayta urining."}, status=429)
                response["Retry-After"] = str(seconds)
                return response
            return fn(request, *args, **kwargs)
        return wrapped
    return decorate


def lock_workspace():
    WorkspaceLock.objects.filter(pk=1).update(sequence=F("sequence") + 1)


def revision(obj):
    import json
    values = {f.attname: str(getattr(obj, f.attname)) for f in obj._meta.concrete_fields}
    return salted_hmac("workspace-revision", json.dumps(values, sort_keys=True)).hexdigest()


class ApiSafetyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith("/django-admin/") and request.method == "POST":
            if not allow("django-admin", client_address(request), 10, 600):
                return JsonResponse({"detail": "Too many attempts"}, status=429)
        if request.path.startswith("/api/"):
            from django.core.exceptions import RequestDataTooBig
            try:
                if len(request.body) > settings.DATA_UPLOAD_MAX_MEMORY_SIZE:
                    raise RequestDataTooBig()
            except RequestDataTooBig:
                return JsonResponse({"detail": "So‘rov hajmi juda katta."}, status=413)
            if request.method not in ("GET", "HEAD", "OPTIONS") and request.body and request.content_type != "application/json":
                return JsonResponse({"detail": "JSON so‘rov yuboring."}, status=415)
        response = self.get_response(request)
        if request.path.startswith("/api/"):
            response["Cache-Control"] = "no-store"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response
