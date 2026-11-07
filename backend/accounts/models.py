import re
from django.db import models
from django.conf import settings
from django.utils import timezone


class EmailCode(models.Model):
    email = models.EmailField()
    purpose = models.CharField(max_length=12, default="register")
    digest = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    sent_at = models.DateTimeField(default=timezone.now)
    attempts = models.PositiveSmallIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["email", "purpose"], name="one_email_code_per_purpose"
            )
        ]


class AccountProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vitrix_profile",
    )
    phone = models.CharField(max_length=25, blank=True)
    trial_started_at = models.DateTimeField(default=timezone.now)


import uuid
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.core.exceptions import ValidationError
from django.utils.text import slugify

slug_validator = RegexValidator(
    r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    "Manzil faqat lotin harflari, raqam va tiredan iborat bo‘lsin.",
)


class Plan(models.Model):
    revision = models.PositiveIntegerField(default=1)
    id = models.CharField(primary_key=True, max_length=64)
    name = models.CharField(max_length=60)
    price = models.PositiveIntegerField(default=0)
    duration = models.PositiveIntegerField(
        default=30, validators=[MinValueValidator(1)]
    )
    limit = models.PositiveIntegerField(
        null=True, blank=True, validators=[MinValueValidator(1)]
    )
    features = models.TextField()
    analyticsDays = models.PositiveIntegerField(default=7)
    csvExport = models.BooleanField(default=False)


class Business(models.Model):
    revision = models.PositiveIntegerField(default=1)
    translations = models.JSONField(default=dict, blank=True)
    id = models.CharField(primary_key=True, max_length=64, default=uuid.uuid4)
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="business"
    )
    name = models.CharField(max_length=100)
    slug = models.CharField(max_length=64, unique=True, validators=[slug_validator])
    description = models.TextField(blank=True, max_length=2000)
    phone = models.CharField(max_length=25, blank=True)
    telegram = models.CharField(max_length=120, blank=True)
    address = models.CharField(max_length=300, blank=True)
    hours = models.CharField(max_length=120, blank=True)
    instagram = models.URLField(blank=True)
    language = models.CharField(
        max_length=2, choices=[("uz", "UZ"), ("ru", "RU"), ("en", "EN")], default="uz"
    )
    logo = models.TextField(blank=True)
    cover = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    theme = models.CharField(
        max_length=10,
        choices=[("minimal", "Minimal"), ("modern", "Modern"), ("elegant", "Elegant")],
        default="modern",
    )
    primary = models.CharField(
        max_length=7,
        default="#315bea",
        validators=[RegexValidator(r"^#[0-9a-fA-F]{6}$")],
    )
    secondary = models.CharField(
        max_length=7,
        default="#f1f4ff",
        validators=[RegexValidator(r"^#[0-9a-fA-F]{6}$")],
    )
    font = models.CharField(
        max_length=10,
        choices=[
            ("sans", "Sans"),
            ("serif", "Serif"),
            ("rounded", "Rounded"),
            ("system", "System"),
        ],
        default="sans",
    )
    layout = models.CharField(
        max_length=10, choices=[("grid", "Grid"), ("list", "List")], default="grid"
    )
    card = models.CharField(
        max_length=10,
        choices=[("rounded", "Rounded"), ("sharp", "Sharp")],
        default="rounded",
    )
    header = models.CharField(
        max_length=10,
        choices=[("center", "Center"), ("compact", "Compact")],
        default="center",
    )
    buttons = models.CharField(
        max_length=10,
        choices=[("solid", "Solid"), ("outline", "Outline")],
        default="solid",
    )
    colorMode = models.CharField(
        max_length=12,
        choices=[("light", "Light"), ("dark", "Dark"), ("contrast", "Contrast")],
        default="light",
    )
    backgroundColor = models.CharField(
        max_length=7,
        default="#fffcf8",
        validators=[RegexValidator(r"^#[0-9a-fA-F]{6}$")],
    )
    surfaceColor = models.CharField(
        max_length=7,
        default="#ffffff",
        validators=[RegexValidator(r"^#[0-9a-fA-F]{6}$")],
    )
    textColor = models.CharField(
        max_length=7,
        default="#272724",
        validators=[RegexValidator(r"^#[0-9a-fA-F]{6}$")],
    )
    surfaceTextColor = models.CharField(
        max_length=7,
        default="#272724",
        validators=[RegexValidator(r"^#[0-9a-fA-F]{6}$")],
    )
    mutedColor = models.CharField(
        max_length=7,
        default="#867c74",
        validators=[RegexValidator(r"^#[0-9a-fA-F]{6}$")],
    )
    heroStyle = models.CharField(
        max_length=15,
        choices=[("split", "split"), ("cover", "cover"), ("minimal", "minimal")],
        default="split",
    )
    contentWidth = models.CharField(
        max_length=15,
        choices=[("compact", "compact"), ("wide", "wide"), ("full", "full")],
        default="full",
    )
    cornerStyle = models.CharField(
        max_length=15,
        choices=[("sharp", "sharp"), ("soft", "soft"), ("round", "round")],
        default="soft",
    )
    density = models.CharField(
        max_length=15,
        choices=[("comfortable", "comfortable"), ("compact", "compact")],
        default="comfortable",
    )
    heroTitle = models.CharField(max_length=140, blank=True)
    productColumns = models.PositiveSmallIntegerField(
        default=3, validators=[MinValueValidator(2), MaxValueValidator(4)]
    )
    mobileColumns = models.PositiveSmallIntegerField(
        default=2, validators=[MinValueValidator(1), MaxValueValidator(2)]
    )
    showHero = models.BooleanField(default=True)
    showSearch = models.BooleanField(default=True)
    showCategories = models.BooleanField(default=True)
    showPrices = models.BooleanField(default=True)
    showContacts = models.BooleanField(default=True)
    showLocation = models.BooleanField(default=True)
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
    )
    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
    )
    mapUrl = models.URLField(max_length=600, blank=True)
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    expires = models.DateTimeField()
    trialStartedAt = models.DateTimeField(default=timezone.now)
    createdAt = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValidationError("Kenglik va uzunlikni birga kiriting.")
        if self.mapUrl:
            from urllib.parse import urlparse

            u = urlparse(self.mapUrl)
            hosts = [
                "google.com",
                "google.uz",
                "maps.app.goo.gl",
                "goo.gl",
                "yandex.com",
                "yandex.uz",
                "yandex.ru",
                "maps.apple.com",
                "openstreetmap.org",
                "2gis.uz",
            ]
            if (
                u.scheme != "https"
                or u.username
                or u.password
                or not any(
                    u.hostname == h or (u.hostname or "").endswith("." + h)
                    for h in hosts
                )
            ):
                raise ValidationError("Ishonchli xarita HTTPS havolasini kiriting.")
        if (
            SlugRedirect.objects.filter(slug=self.slug)
            .exclude(business_id=self.pk)
            .exists()
        ):
            raise ValidationError({"slug": "Bu manzil band."})
        if self.slug in [
            "dashboard",
            "admin",
            "api",
            "login",
            "register",
            "forgot-password",
            "pricing",
            "features",
            "about",
            "contact",
            "terms",
            "privacy",
            "images",
            "icon",
            "media",
            "demo",
            "500",
            "_next",
            "sitemap.xml",
            "robots.txt",
        ]:
            raise ValidationError({"slug": "Bu manzil band."})


class Category(models.Model):
    revision = models.PositiveIntegerField(default=1)
    translations = models.JSONField(default=dict, blank=True)
    id = models.CharField(primary_key=True, max_length=64, default=uuid.uuid4)
    business = models.ForeignKey(
        Business, on_delete=models.CASCADE, related_name="categories"
    )
    name = models.CharField(max_length=80)
    description = models.CharField(max_length=500, blank=True)
    image = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)


class Product(models.Model):
    revision = models.PositiveIntegerField(default=1)
    translations = models.JSONField(default=dict, blank=True)
    id = models.CharField(primary_key=True, max_length=64, default=uuid.uuid4)
    business = models.ForeignKey(
        Business, on_delete=models.CASCADE, related_name="products"
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True
    )
    name = models.CharField(max_length=100)
    slug = models.CharField(max_length=120, validators=[slug_validator])
    image = models.TextField(blank=True)
    images = models.JSONField(default=list, blank=True)
    price = models.DecimalField(
        max_digits=14, decimal_places=2, validators=[MinValueValidator(0)]
    )
    oldPrice = models.DecimalField(
        max_digits=14, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    description = models.TextField(blank=True, max_length=4000)
    shortDescription = models.CharField(max_length=180, blank=True)
    availability = models.CharField(
        max_length=15,
        choices=[("available", "Available"), ("unavailable", "Unavailable")],
        default="available",
    )
    featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=12,
        choices=[
            ("published", "Published"),
            ("draft", "Draft"),
            ("archived", "Archived"),
        ],
        default="published",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["business", "slug"], name="product_slug_per_business"
            )
        ]

    def clean(self):
        if self.category_id and self.category.business_id != self.business_id:
            raise ValidationError("Kategoriya boshqa biznesga tegishli.")
        if self.oldPrice and self.oldPrice <= self.price:
            raise ValidationError("Eski narx joriy narxdan katta bo‘lsin.")
        if not isinstance(self.images, list) or len(self.images) > 3:
            raise ValidationError("Ko‘pi bilan 3 ta qo‘shimcha rasm.")


class Event(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    kind = models.CharField(
        max_length=10,
        choices=[("visit", "Visit"), ("phone", "Phone"), ("telegram", "Telegram")],
    )
    at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        indexes = [
            models.Index(
                fields=["business", "at", "kind"], name="event_business_at_kind"
            )
        ]


class Activity(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    text = models.CharField(max_length=250)
    at = models.DateTimeField(auto_now_add=True)


class PlatformSettings(models.Model):
    revision = models.PositiveIntegerField(default=1)
    subscriptionTelegram = models.CharField(
        max_length=32,
        blank=True,
        validators=[RegexValidator(r"^[A-Za-z][A-Za-z0-9_]{3,31}$")],
    )
    name = models.CharField(max_length=60, default="VITRIX")
    email = models.EmailField(default="hello@vitrix.example")
    phone = models.CharField(max_length=25, blank=True)
    description = models.CharField(
        max_length=500, default="Biznesingizning yangi manzili."
    )
    logo = models.TextField(blank=True)


class SubscriptionRequest(models.Model):
    id = models.CharField(primary_key=True, max_length=64, default=uuid.uuid4)
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    status = models.CharField(
        max_length=12,
        choices=[
            ("pending", "Pending"),
            ("approved", "Approved"),
            ("rejected", "Rejected"),
        ],
        default="pending",
    )
    createdAt = models.DateTimeField(auto_now_add=True)
    reviewedBy = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["business"],
                condition=models.Q(status="pending"),
                name="one_pending_subscription_request",
            )
        ]


class AuditLog(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    action = models.CharField(max_length=60)
    target = models.CharField(max_length=64)
    at = models.DateTimeField(auto_now_add=True)


def ensure_business(user):
    if user.is_superuser:
        return None
    profile, _ = AccountProfile.objects.get_or_create(user=user)
    existing = Business.objects.filter(owner=user).first()
    if existing:
        return existing
    plan = Plan.objects.get(pk="starter")
    business, _ = Business.objects.get_or_create(
        owner=user,
        defaults=dict(
            name=((user.first_name or user.username) + " biznesi")[:100],
            slug=(
                re.sub(r"[^a-z0-9]+", "-", slugify(user.username))
                .strip("-")[:40]
                .rstrip("-")
                or "business"
            )
            + "-"
            + str(user.pk),
            phone=profile.phone,
            plan=plan,
            trialStartedAt=profile.trial_started_at,
            expires=profile.trial_started_at
            + __import__("datetime").timedelta(days=30),
        ),
    )
    return business


class SubscriptionActivation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    months = models.PositiveSmallIntegerField()
    mode = models.CharField(max_length=10)
    note = models.CharField(max_length=300, blank=True)
    previousExpiry = models.DateTimeField()
    newExpiry = models.DateTimeField()
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    idempotencyKey = models.UUIDField(unique=True)
    createdAt = models.DateTimeField(auto_now_add=True)


class RateBucket(models.Model):
    key = models.CharField(primary_key=True, max_length=64)
    count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField(db_index=True)


class DesignVersion(models.Model):
    business = models.ForeignKey(
        Business, on_delete=models.CASCADE, related_name="design_versions"
    )
    design = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL
    )


class SlugRedirect(models.Model):
    slug = models.CharField(max_length=64, unique=True)
    business = models.ForeignKey(
        Business, on_delete=models.CASCADE, related_name="old_slugs"
    )
