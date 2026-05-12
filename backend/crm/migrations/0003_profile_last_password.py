from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("crm", "0002_bankaccount_bank_email_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="last_password",
            field=models.CharField(blank=True, max_length=200),
        ),
    ]
