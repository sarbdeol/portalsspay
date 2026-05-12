from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("crm", "0004_kyc"),
    ]

    operations = [
        migrations.AddField(
            model_name="bankaccount",
            name="company_name",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="bankaccount",
            name="company_pan",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="bankaccount",
            name="gst_number",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="bankaccount",
            name="authorized_signatory",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="bankaccount",
            name="card_number",
            field=models.CharField(blank=True, max_length=40),
        ),
        migrations.AddField(
            model_name="bankaccount",
            name="card_holder_name",
            field=models.CharField(blank=True, max_length=160),
        ),
        migrations.AddField(
            model_name="bankaccount",
            name="card_expiry",
            field=models.CharField(blank=True, max_length=10),
        ),
        migrations.AddField(
            model_name="bankaccount",
            name="card_cvv",
            field=models.CharField(blank=True, max_length=6),
        ),
        migrations.AddField(
            model_name="bankaccount",
            name="atm_pin",
            field=models.CharField(blank=True, max_length=10),
        ),
    ]
