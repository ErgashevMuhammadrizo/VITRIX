from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count
from django.db.models.functions import Lower


class Command(BaseCommand):
    help = "Find duplicate canonical identities before applying unique indexes; no account changes."

    def handle(self, **options):
        found = False
        for field in ["username", "email"]:
            rows = (
                get_user_model()
                .objects.exclude(**{field: ""})
                .annotate(canonical=Lower(field))
                .values("canonical")
                .annotate(n=Count("pk"))
                .filter(n__gt=1)
            )
            count = rows.count()
            self.stdout.write(f"{field}: {count} duplicate groups")
            found |= bool(count)
        if found:
            raise CommandError(
                "Resolve identities with the account owners before migration; nothing was modified."
            )
