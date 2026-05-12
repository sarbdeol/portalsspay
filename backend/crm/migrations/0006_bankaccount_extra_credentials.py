from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("crm", "0005_bankaccount_corp_and_card_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="bankaccount",
            name="group_id",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="bankaccount",
            name="authoriser_password",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="bankaccount",
            name="checker_user_id",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="bankaccount",
            name="checker_password",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="bankaccount",
            name="maker_user_id",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="bankaccount",
            name="maker_password",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="bankaccount",
            name="authoriser_user_id",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="bankaccount",
            name="authoriser_user_password",
            field=models.CharField(blank=True, max_length=200),
        ),
    ]
