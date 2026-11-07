"""Consistent SQLite online backup; deliberately never overwrites an existing file."""
import os
import sqlite3
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

class Command(BaseCommand):
    help = 'Create a verified SQLite database backup outside the public media directory.'
    def add_arguments(self, parser):
        parser.add_argument('destination')
    def handle(self, *args, **options):
        config=settings.DATABASES['default']
        if not config['ENGINE'].endswith('sqlite3'):
            raise CommandError('For PostgreSQL use pg_dump with a protected destination.')
        target=Path(options['destination']).resolve()
        source=Path(config['NAME']).resolve()
        media=Path(settings.MEDIA_ROOT).resolve()
        if target == source or target.is_relative_to(media):
            raise CommandError('Destination must be outside the database and public media paths.')
        if not source.is_file():
            raise CommandError('Source database does not exist.')
        descriptor=os.open(target,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
        os.close(descriptor)
        try:
            with sqlite3.connect(source.as_uri()+'?mode=ro',uri=True) as original,sqlite3.connect(target) as backup:
                original.backup(backup)
                if backup.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                    raise CommandError('Backup integrity verification failed.')
        except Exception:
            target.unlink(missing_ok=True)
            raise
        self.stdout.write('Verified SQLite backup created. Keep it private and copy it off-host.')
