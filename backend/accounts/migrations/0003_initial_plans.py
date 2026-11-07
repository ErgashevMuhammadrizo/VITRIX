from django.db import migrations


def seed(apps, schema_editor):
    Plan = apps.get_model("accounts", "Plan")
    data = [
        (
            "starter",
            "Bepul sinov",
            0,
            1000,
            7,
            False,
            "Birinchi 1 oy bepul (30 kun)\n1 000 ta mahsulot\nCheksiz kategoriyalar\n3 ta dizayn\nTelefon va Telegram\n7 kunlik statistika",
        ),
        (
            "pro",
            "Pro",
            20000,
            None,
            7,
            False,
            "Cheksiz mahsulotlar\nCheksiz kategoriyalar\n3 ta professional dizayn\nTo‘liq brending\nTelefon va Telegram\n7 kunlik statistika",
        ),
        (
            "vip",
            "VIP",
            39000,
            None,
            90,
            True,
            "Barcha Pro imkoniyatlari\nCheksiz mahsulotlar\n7 / 30 / 90 kunlik analitika\nDavr bo‘yicha aloqa statistikasi\nCSV eksporti",
        ),
    ]
    for pk, name, price, limit, days, csv, features in data:
        Plan.objects.get_or_create(
            pk=pk,
            defaults={
                "name": name,
                "price": price,
                "limit": limit,
                "duration": 30,
                "analyticsDays": days,
                "csvExport": csv,
                "features": features,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_plan_platformsettings_auditlog_business_activity_and_more")
    ]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
