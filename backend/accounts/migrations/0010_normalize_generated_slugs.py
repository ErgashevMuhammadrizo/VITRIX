"""Repair legacy username-derived slugs, preserving their incoming links."""

import re
from django.db import migrations


def forward(apps, schema_editor):
    Business = apps.get_model("accounts", "Business")
    Redirect = apps.get_model("accounts", "SlugRedirect")
    for b in Business.objects.filter(slug__contains="_").iterator():
        original = b.slug
        base = re.sub("[^a-z0-9]+", "-", original.lower()).strip("-")[:56] or "shop"
        candidate = base
        suffix = 1
        while (
            Business.objects.exclude(pk=b.pk).filter(slug=candidate).exists()
            or Redirect.objects.exclude(business_id=b.pk)
            .filter(slug=candidate)
            .exists()
        ):
            candidate = base + "-" + str(suffix)
            suffix += 1
        Redirect.objects.get_or_create(slug=original, defaults={"business_id": b.pk})
        Business.objects.filter(pk=b.pk).update(slug=candidate)


class Migration(migrations.Migration):
    dependencies = [("accounts", "0009_canonical_identity")]
    operations = [migrations.RunPython(forward, migrations.RunPython.noop)]
