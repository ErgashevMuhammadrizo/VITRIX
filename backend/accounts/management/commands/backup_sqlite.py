import hashlib, json, shutil, sqlite3
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection


class Command(BaseCommand):
    help = "Consistent SQLite online backup plus media and SHA256 manifest. Does not include environment secrets."

    def add_arguments(self, parser):
        parser.add_argument("destination")

    def handle(self, destination, **options):
        if connection.vendor != "sqlite":
            raise CommandError("Use pg_dump for PostgreSQL.")
        target = Path(destination).resolve()
        if target.exists():
            raise CommandError("Destination must be new.")
        source = Path(settings.DATABASES["default"]["NAME"]).resolve()
        if not source.is_file():
            raise CommandError("SQLite source not found.")
        if (
            target == Path(settings.MEDIA_ROOT).resolve()
            or Path(settings.MEDIA_ROOT).resolve() in target.parents
        ):
            raise CommandError("Backup must be outside media.")
        target.mkdir(parents=True)
        try:
            with sqlite3.connect(source) as src, sqlite3.connect(
                target / "db.sqlite3"
            ) as dest:
                src.backup(dest)
            media = Path(settings.MEDIA_ROOT)
            if media.exists():
                shutil.copytree(media, target / "media")
            else:
                (target / "media").mkdir()
            files = {
                str(p.relative_to(target)): hashlib.sha256(p.read_bytes()).hexdigest()
                for p in target.rglob("*")
                if p.is_file()
            }
            (target / "manifest.json").write_text(
                json.dumps({"format": 1, "files": files}, indent=2)
            )
            self.stdout.write(
                self.style.SUCCESS(
                    "Backup completed. Run verify_backup before relying on it."
                )
            )
        except Exception:
            shutil.rmtree(target)
            raise
