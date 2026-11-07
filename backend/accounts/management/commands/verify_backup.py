import hashlib, json, sqlite3
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = (
        "Verify backup hashes and SQLite integrity without touching the live database."
    )

    def add_arguments(self, parser):
        parser.add_argument("source")

    def handle(self, source, **options):
        root = Path(source).resolve()
        manifest = json.loads((root / "manifest.json").read_text())
        for name, digest in manifest["files"].items():
            path = (root / name).resolve()
            if (
                root not in path.parents
                or not path.is_file()
                or hashlib.sha256(path.read_bytes()).hexdigest() != digest
            ):
                raise CommandError("Backup hash verification failed.")
        with sqlite3.connect(f'file:{root / "db.sqlite3"}?mode=ro', uri=True) as db:
            if db.execute("pragma integrity_check").fetchone()[0] != "ok":
                raise CommandError("SQLite integrity failed.")
        self.stdout.write(
            self.style.SUCCESS(
                "Hashes and database integrity verified. Rehearse application startup against a restored copy."
            )
        )
