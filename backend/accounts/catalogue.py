"""Bounded queries and explicit public representations."""

from datetime import timedelta
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from zoneinfo import ZoneInfo
from .models import Business, Product, Category, Event

TZ = ZoneInfo("Asia/Tashkent")
DESIGN_FIELDS = [
    "theme",
    "primary",
    "secondary",
    "font",
    "layout",
    "card",
    "header",
    "buttons",
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
]


def page(queryset, request, serialize, key="items", default=24):
    try:
        number = max(1, int(request.GET.get("page", 1)))
        size = min(100, max(1, int(request.GET.get("pageSize", default))))
    except (ValueError, TypeError):
        raise ValueError("Invalid pagination")
    if number > 1000000:
        raise ValueError("Invalid pagination")
    total = queryset.count()
    return {
        key: (
            [serialize(x) for x in queryset[(number - 1) * size : number * size]]
            if (number - 1) * size < total
            else []
        ),
        "pagination": {
            "page": number,
            "pageSize": size,
            "total": total,
            "hasMore": number * size < total,
        },
    }


def analytics(business, days=None):
    days = min(
        max(int(days or business.plan.analyticsDays), 1),
        business.plan.analyticsDays,
        90,
    )
    # Calendar days in the merchant timezone, including today.
    today = timezone.localdate(timezone=TZ)
    since = timezone.make_aware(
        timezone.datetime.combine(
            today - timedelta(days=days - 1), timezone.datetime.min.time()
        ),
        TZ,
    )
    query = Event.objects.filter(business=business, at__gte=since)
    rows = (
        query.annotate(day=TruncDate("at", tzinfo=TZ))
        .values("day", "kind")
        .annotate(count=Count("pk"))
        .order_by("day", "kind")
    )
    daily = [
        {"day": str(r["day"]), "kind": r["kind"], "count": r["count"]} for r in rows
    ]
    return {
        "days": days,
        "timezone": "Asia/Tashkent",
        "since": since.isoformat(),
        "today": str(today),
        "daily": daily,
        "totals": {
            kind: sum(r["count"] for r in daily if r["kind"] == kind)
            for kind in ["visit", "phone", "telegram"]
        },
    }


def public_business_record(b):
    fields = [
        "id",
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
        "latitude",
        "longitude",
        "mapUrl",
        "translations",
    ] + DESIGN_FIELDS
    result = {k: getattr(b, k) for k in fields}
    for k in ["latitude", "longitude"]:
        result[k] = float(result[k]) if result[k] is not None else None
    if not b.showContacts:
        for k in ["phone", "telegram", "instagram"]:
            result[k] = ""
    if not b.showLocation:
        for k in ["address", "mapUrl"]:
            result[k] = ""
        result["latitude"] = result["longitude"] = None
        result["translations"] = {
            lang: {k: v for k, v in text.items() if k != "address"}
            for lang, text in b.translations.items()
        }
    return result


def published_products(b):
    return (
        b.products.filter(status="published")
        .filter(Q(category__isnull=True) | Q(category__active=True))
        .order_by("order", "id")
    )


def product_public(p, business):
    from .workspace import product_record

    result = product_record(p)
    for key in ["revision", "businessId", "order", "status"]:
        result.pop(key, None)
    result["businessId"] = str(business.pk)
    if not business.showPrices:
        result.pop("price", None)
        result.pop("oldPrice", None)
    return result
