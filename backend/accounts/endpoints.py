import csv
import io
from django.db import transaction
from django.db.models import Q, Count
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from .views import protected, error, identity, payload, User
from .models import (
    Business,
    Product,
    Category,
    DesignVersion,
    SlugRedirect,
    SubscriptionActivation,
)
from .catalogue import analytics, page, DESIGN_FIELDS
from .workspace import (
    business_record,
    product_record,
    category_record,
    assign,
    check_revision,
    RevisionConflict,
    check_business,
)


@require_http_methods(["GET"])
@protected()
def collection(request, entity):
    if entity == "activations":
        if not request.user.is_superuser:
            return error("Ruxsat yo‘q.", 403)
        try:
            return JsonResponse(
                page(
                    SubscriptionActivation.objects.select_related(
                        "business", "plan", "actor"
                    ).order_by("-createdAt"),
                    request,
                    lambda a: {
                        "id": str(a.pk),
                        "businessName": a.business.name,
                        "planName": a.plan.name,
                        "months": a.months,
                        "newExpiry": a.newExpiry.isoformat(),
                        "createdAt": a.createdAt.isoformat(),
                        "actor": a.actor.username if a.actor else "",
                        "note": a.note,
                    },
                )
            )
        except ValueError:
            return error("Sahifa raqamini tekshiring.")
    scope = {} if request.user.is_superuser else {"business__owner": request.user}
    serializers = {
        "products": (Product, product_record),
        "categories": (Category, category_record),
        "businesses": (Business, business_record),
        "users": (User, identity),
    }
    if entity not in serializers:
        return error("Yozuv topilmadi.", 404)
    model, serialize = serializers[entity]
    if entity in ["businesses", "users"]:
        scope = (
            {}
            if request.user.is_superuser
            else (
                {"owner": request.user}
                if entity == "businesses"
                else {"pk": request.user.pk}
            )
        )
    query = model.objects.filter(**scope).order_by("pk")
    if entity == "categories":
        query = query.annotate(productCount=Count("product"))
    if entity in ["products", "categories"]:
        if request.GET.get("businessId"):
            query = query.filter(business_id=request.GET["businessId"])
        if request.GET.get("q"):
            query = query.filter(name__icontains=request.GET["q"][:100])
        if entity == "products":
            if request.GET.get("categoryId"):
                query = query.filter(category_id=request.GET["categoryId"])
            if request.GET.get("status"):
                query = query.filter(status=request.GET["status"])
        ordering = {"price": "price", "name": "name", "order": "order"}.get(
            request.GET.get("sort"), "order"
        )
        query = query.order_by(ordering, "id")
    else:
        term = request.GET.get("q", "")[:100]
        if term:
            if entity == "users":
                predicate = (
                    Q(username__icontains=term)
                    | Q(email__icontains=term)
                    | Q(first_name__icontains=term)
                    | Q(last_name__icontains=term)
                )
                if term.upper().startswith("VX-") and term[3:].isdigit():
                    predicate |= Q(pk=int(term[3:]))
            else:
                predicate = (
                    Q(name__icontains=term)
                    | Q(slug__icontains=term)
                    | Q(owner__email__icontains=term)
                    | Q(owner__username__icontains=term)
                )
                if term.upper().startswith("VX-") and term[3:].isdigit():
                    predicate |= Q(owner_id=int(term[3:]))
            query = query.filter(predicate)
        status = request.GET.get("status")
        if status in ["true", "false"]:
            query = query.filter(
                **{("is_active" if entity == "users" else "active"): status == "true"}
            )
        if entity == "businesses":
            subscription = request.GET.get("subscription")
            if subscription == "active":
                query = query.filter(expires__gt=timezone.now())
            if subscription == "expired":
                query = query.filter(expires__lte=timezone.now())
            if subscription == "pending":
                query = query.filter(subscriptionrequest__status="pending").distinct()
    try:
        return JsonResponse(page(query, request, serialize))
    except ValueError:
        return error("Sahifa raqamini tekshiring.")


@require_http_methods(["GET"])
@protected()
def statistics(request, business_id):
    try:
        b = check_business(request.user, business_id, False)
        return JsonResponse(analytics(b, request.GET.get("days")))
    except PermissionError:
        return error("Ruxsat yo‘q.", 403)
    except (ValueError, TypeError):
        return error("Davrni tekshiring.")


@require_http_methods(["GET"])
@protected()
def export_events(request, business_id):
    try:
        b = check_business(request.user, business_id, False)
        if not b.plan.csvExport and not request.user.is_superuser:
            return error("CSV uchun VIP kerak.", 403)
        period = analytics(b, request.GET.get("days"))
    except PermissionError:
        return error("Ruxsat yo‘q.", 403)
    except (ValueError, TypeError):
        return error("Davrni tekshiring.")
    # iterator fetches bounded chunks; no 20k cut and no complete in-memory CSV.
    rows = (
        b.event_set.filter(at__gte=period["since"])
        .order_by("at", "pk")
        .values_list("kind", "at")
    )

    def stream():
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["event", "timestamp"])
        yield buffer.getvalue()
        buffer.seek(0)
        buffer.truncate(0)
        for kind, at in rows.iterator(chunk_size=1000):
            writer.writerow([kind, at.isoformat()])
            yield buffer.getvalue()
            buffer.seek(0)
            buffer.truncate(0)

    response = StreamingHttpResponse(stream(), content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = 'attachment; filename="vitrix-analytics.csv"'
    response["Cache-Control"] = "no-store"
    return response


@require_http_methods(["GET", "POST"])
@protected()
def designs(request, business_id):
    try:
        with transaction.atomic():
            b = check_business(request.user, business_id, request.method == "POST")
            if request.method == "GET":
                return JsonResponse(
                    {
                        "versions": [
                            {
                                "id": v.pk,
                                "createdAt": v.created_at.isoformat(),
                                "design": v.design,
                            }
                            for v in b.design_versions.order_by("-pk")[:30]
                        ]
                    }
                )
            data = payload(request)
            check_revision(b, data)
            if type(data.get("versionId")) is not int:
                return error("Versiyani tanlang.")
            version = b.design_versions.filter(pk=data["versionId"]).first()
            if not version:
                return error("Versiya topilmadi.", 404)
            # Only style allowlist; never restore contacts, products or subscription.
            assign(
                b,
                {k: v for k, v in version.design.items() if k in DESIGN_FIELDS},
                DESIGN_FIELDS,
            )
            DesignVersion.objects.create(
                business=b,
                design={k: getattr(b, k) for k in DESIGN_FIELDS},
                actor=request.user,
            )
            return JsonResponse({"business": business_record(b)})
    except RevisionConflict:
        return error(
            "Bu yozuv boshqa oynada o‘zgargan. Yangilang va qayta saqlang.", 409
        )
    except PermissionError:
        return error("Ruxsat yo‘q.", 403)
    except (ValueError, TypeError):
        return error("So‘rovni tekshiring.")


@require_http_methods(["GET"])
def sitemap_data(request):
    try:
        if request.GET.get("type") == "products":
            query = (
                Product.objects.filter(
                    status="published",
                    business__active=True,
                    business__owner__is_active=True,
                    business__expires__gt=timezone.now(),
                )
                .filter(Q(category__isnull=True) | Q(category__active=True))
                .select_related("business")
                .order_by("id")
            )
            return JsonResponse(
                page(
                    query,
                    request,
                    lambda p: {"slug": p.business.slug, "product": p.slug},
                    default=100,
                )
            )
        query = Business.objects.filter(
            active=True, owner__is_active=True, expires__gt=timezone.now()
        ).order_by("id")
        return JsonResponse(
            page(
                query,
                request,
                lambda b: {"slug": b.slug, "language": b.language},
                default=100,
            )
        )
    except ValueError:
        return error("Sahifa raqamini tekshiring.")
