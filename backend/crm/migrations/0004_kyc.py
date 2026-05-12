import uuid

import django.db.models.deletion
from django.db import migrations, models

import crm.models


class Migration(migrations.Migration):

    dependencies = [
        ("crm", "0003_profile_last_password"),
    ]

    operations = [
        migrations.AddField(
            model_name="bankaccount",
            name="kyc_token",
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.CreateModel(
            name="KycDocument",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("file", models.FileField(upload_to=crm.models.kyc_upload_path)),
                ("label", models.CharField(blank=True, max_length=160)),
                ("uploaded_by", models.CharField(blank=True, max_length=160)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "bank_account",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="kyc_documents",
                        to="crm.bankaccount",
                    ),
                ),
            ],
            options={"ordering": ["-uploaded_at"]},
        ),
    ]
