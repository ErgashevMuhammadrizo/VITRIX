from django.db import migrations

def update_prices(apps, schema_editor):
    Plan=apps.get_model('accounts','Plan')
    Plan.objects.filter(pk='pro').update(price=49000)
    Plan.objects.filter(pk='vip').update(price=99000)

def reverse_prices(apps,schema_editor):
    Plan=apps.get_model('accounts','Plan')
    Plan.objects.filter(pk='pro').update(price=20000)
    Plan.objects.filter(pk='vip').update(price=39000)

class Migration(migrations.Migration):
    dependencies=[('accounts','0006_business_translations_category_translations_and_more')]
    operations=[migrations.RunPython(update_prices,reverse_prices)]
