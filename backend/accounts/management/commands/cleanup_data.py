from datetime import timedelta
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import (
    RateBucket,
    EmailCode,
    Event,
    Business,
    Product,
    Category,
    PlatformSettings,
    DesignVersion,
)


class Command(BaseCommand):
    help = "Dry-run by default: expired codes/rate buckets, events beyond 100 days and unreferenced uploads older than 24h."

    def add_arguments(self, parser):
        parser.add_argument("--apply", action="store_true")

    def handle(self, **options):
        now = timezone.now()
        queries = [
            RateBucket.objects.filter(expires_at__lt=now),
            EmailCode.objects.filter(expires_at__lt=now - timedelta(days=1)),
            Event.objects.filter(at__lt=now - timedelta(days=100)),
        ]
        references = set()
        for model, fields in [
            (Business, ["logo", "cover"]),
            (Product, ["image", "images"]),
            (Category, ["image"]),
            (PlatformSettings, ["logo"]),
        ]:
            for row in model.objects.values_list(*fields).iterator(chunk_size=500):
                for value in row:
                    for url in value if isinstance(value, list) else [value]:
                        if isinstance(url, str) and url.startswith("/media/"):
                            references.add(url[7:])
        media = Path(settings.MEDIA_ROOT)
        orphan = []
        directory = media / "uploads"
        if directory.exists():
            orphan = [
                p
                for p in directory.iterdir()
                if p.is_file()
                and not p.is_symlink()
                and str(p.relative_to(media)) not in references
                and now.timestamp() - p.stat().st_mtime > 86400
            ]
        self.stdout.write(
            f"Rows eligible: {sum(q.count() for q in queries)}; orphan files: {len(orphan)}"
        )
        if options["apply"]:
            for query in queries:
                query.delete()
            for path in orphan:
                path.unlink()
            # Retain the newest 30 design versions for each business.
            for b in Business.objects.iterator():
                keep = list(
                    b.design_versions.order_by("-pk").values_list("pk", flat=True)[:30]
                )
                b.design_versions.exclude(pk__in=keep).delete()
            self.stdout.write("Cleanup applied.")
        else:
            self.stdout.write(
                "Dry run only. Pass --apply after reviewing and backing up."
            )
