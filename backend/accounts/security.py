"""Database-backed abuse control shared by sessions and gunicorn processes."""

import hashlib
import hmac
import ipaddress
import logging
import time
import uuid
from django.conf import settings
from django.db import OperationalError, transaction
from django.db.models import F
from django.http import JsonResponse
from django.utils import timezone
from .models import RateBucket

logger = logging.getLogger("vitrix.requests")


def client_ip(request):
    peer = request.META.get("REMOTE_ADDR", "")
    try:
        address = ipaddress.ip_address(peer)
        trusted = any(
            address in ipaddress.ip_network(c.strip())
            for c in settings.TRUSTED_PROXY_CIDRS
            if c.strip()
        )
        if settings.TRUST_PROXY_IP and trusted:
            # The ingress MUST overwrite X-Forwarded-For; never enable for a public backend.
            return str(
                ipaddress.ip_address(
                    request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
                )
            )
        return str(address)
    except ValueError:
        return "unknown"


def allow(scope, identity, limit, seconds):
    now = timezone.now()
    window = int(now.timestamp()) // seconds
    key = hmac.new(
        settings.SECRET_KEY.encode(),
        f"{scope}:{identity}:{window}".encode(),
        hashlib.sha256,
    ).hexdigest()
    with transaction.atomic():
        RateBucket.objects.get_or_create(
            key=key,
            defaults={
                "expires_at": timezone.datetime.fromtimestamp(
                    (window + 1) * seconds, tz=now.tzinfo
                )
            },
        )
        return bool(
            RateBucket.objects.filter(key=key, count__lt=limit).update(
                count=F("count") + 1
            )
        )


def throttle(request, scope, identity, limit, seconds):
    return allow(scope, identity, limit, seconds) and allow(
        scope + ":ip", client_ip(request), max(limit * 20, 200), seconds
    )


class RequestGuardMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.request_id = uuid.uuid4().hex
        start = time.monotonic()
        try:
            response = self.get_response(request)
        except OperationalError:
            response = JsonResponse(
                {"detail": "Server band. Qayta urinib ko‘ring."}, status=503
            )
            response["Retry-After"] = "2"
        response["X-Request-ID"] = request.request_id
        if request.path.startswith("/api/"):
            response["Cache-Control"] = "no-store"
        logger.info(
            "request id=%s method=%s status=%s duration_ms=%d",
            request.request_id,
            request.method,
            response.status_code,
            (time.monotonic() - start) * 1000,
        )
        return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        if (
            request.path.rstrip("/") == "/django-admin/login"
            and request.method == "POST"
        ):
            from django.contrib.auth import get_user_model

            identifier = str(request.POST.get("username", ""))[:254].strip()
            existing = (
                get_user_model().objects.filter(username__iexact=identifier).first()
            )
            key = str(existing.pk) if existing else identifier.casefold()
            if not throttle(request, "login", key, 10, 600):
                return JsonResponse(
                    {"detail": "Ko‘p urinish. 10 daqiqadan keyin qayta urining."},
                    status=429,
                )
        return None

    def process_exception(self, request, exc):
        if isinstance(exc, OperationalError):
            response = JsonResponse(
                {"detail": "Server band. Qayta urinib ko‘ring."}, status=503
            )
            response["Retry-After"] = "2"
            return response
