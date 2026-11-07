from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.management import call_command
from accounts.models import SecurityBucket, EmailCode


class Command(BaseCommand):
    help = "Delete expired abuse buckets, OTPs and sessions (run daily)."
    def handle(self, *args, **options):
        now = timezone.now()
        buckets, _ = SecurityBucket.objects.filter(expires_at__lte=now).delete()
        codes, _ = EmailCode.objects.filter(expires_at__lte=now).delete()
        call_command("clearsessions")
        self.stdout.write(f"Removed {buckets} abuse buckets and {codes} expired codes.")
