from django.db import migrations


def forward(apps, schema_editor):
    User = apps.get_model("auth", "User")
    from django.db.models.functions import Lower
    from django.db.models import Count

    # Stop safely before changing existing accounts. Never merge/delete identities.
    for field in ["username", "email"]:
        duplicates = (
            User.objects.exclude(**{field: ""})
            .annotate(canonical=Lower(field))
            .values("canonical")
            .annotate(n=Count("id"))
            .filter(n__gt=1)
        )
        if duplicates.exists():
            raise RuntimeError(
                "Duplicate canonical identities: run audit_identities before migration; no accounts were changed."
            )
        schema_editor.execute(
            f"CREATE UNIQUE INDEX vitrix_unique_{field}_lower ON auth_user (LOWER({field})) WHERE {field} <> ''"
        )


def reverse(apps, schema_editor):
    schema_editor.execute("DROP INDEX IF EXISTS vitrix_unique_username_lower")
    schema_editor.execute("DROP INDEX IF EXISTS vitrix_unique_email_lower")


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0008_hardening"),
        ("auth", "0012_alter_user_first_name_max_length"),
    ]
    operations = [migrations.RunPython(forward, reverse)]
