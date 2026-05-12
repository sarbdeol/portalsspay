import uuid

from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    ROLE_CHOICES = [("Admin", "Admin"), ("Agent", "Agent"), ("Merchant", "Merchant")]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    mobile = models.CharField(max_length=40, blank=True)
    whatsapp = models.CharField(max_length=40, blank=True)
    telegram = models.CharField(max_length=80, blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    last_password = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.user.email} ({self.role})"


class Agent(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="agent_profile")
    mobile = models.CharField(max_length=40)
    whatsapp = models.CharField(max_length=40, blank=True)
    telegram = models.CharField(max_length=80, blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, default="Active")

    @property
    def name(self):
        return self.user.get_full_name() or self.user.username

    def __str__(self):
        return self.name


class Merchant(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="merchant_profile")
    agent = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, blank=True, related_name="merchants")
    city = models.CharField(max_length=100, blank=True)
    volume = models.CharField(max_length=40, default="₹0")
    status = models.CharField(max_length=20, default="Active")

    @property
    def name(self):
        return self.user.get_full_name() or self.user.username

    def __str__(self):
        return self.name


class BankAccount(models.Model):
    bank_name = models.CharField(max_length=120)
    holder_name = models.CharField(max_length=160)
    account_number = models.CharField(max_length=80)
    ifsc = models.CharField(max_length=20)
    branch = models.CharField(max_length=120, blank=True)
    account_type = models.CharField(max_length=40, default="Current")
    upi_id = models.CharField(max_length=120, blank=True)
    upi_app = models.CharField(max_length=60, blank=True)
    upi_mobile = models.CharField(max_length=40, blank=True)
    customer_id = models.CharField(max_length=120, blank=True)
    user_id = models.CharField(max_length=120, blank=True)
    username = models.CharField(max_length=120, blank=True)
    password = models.CharField(max_length=200, blank=True)
    transaction_password = models.CharField(max_length=200, blank=True)
    mpin = models.CharField(max_length=40, blank=True)
    tpin = models.CharField(max_length=40, blank=True)
    daily_limit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    monthly_limit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    current_usage = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    beneficiary_time_limit = models.CharField(max_length=40, blank=True)
    bank_email = models.EmailField(blank=True)
    status = models.CharField(max_length=20, default="Pending")
    notes = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)
    priority = models.CharField(max_length=20, default="Medium")
    registered_mobile = models.CharField(max_length=40, blank=True)
    recovery_email = models.EmailField(blank=True)
    whatsapp = models.CharField(max_length=40, blank=True)
    login_url = models.URLField(blank=True)
    agent = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, blank=True, related_name="bank_accounts")
    merchant = models.ForeignKey(Merchant, on_delete=models.SET_NULL, null=True, blank=True, related_name="bank_accounts")
    added_date = models.DateField(auto_now_add=True)
    kyc_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    # Corp-only fields (used when account_type == "Corp Account")
    company_name = models.CharField(max_length=200, blank=True)
    company_pan = models.CharField(max_length=20, blank=True)
    gst_number = models.CharField(max_length=20, blank=True)
    authorized_signatory = models.CharField(max_length=200, blank=True)

    # Debit / ATM card
    card_number = models.CharField(max_length=40, blank=True)
    card_holder_name = models.CharField(max_length=160, blank=True)
    card_expiry = models.CharField(max_length=10, blank=True)
    card_cvv = models.CharField(max_length=6, blank=True)
    atm_pin = models.CharField(max_length=10, blank=True)

    # Extra internet-banking credentials (Current / Corp accounts)
    group_id = models.CharField(max_length=120, blank=True)
    authoriser_password = models.CharField(max_length=200, blank=True)
    # 3-user authorization (checker/maker/authoriser) for Current/Corp
    checker_user_id = models.CharField(max_length=120, blank=True)
    checker_password = models.CharField(max_length=200, blank=True)
    maker_user_id = models.CharField(max_length=120, blank=True)
    maker_password = models.CharField(max_length=200, blank=True)
    authoriser_user_id = models.CharField(max_length=120, blank=True)
    authoriser_user_password = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.bank_name} - {self.holder_name}"


def kyc_upload_path(instance, filename):
    return f"kyc/{instance.bank_account.kyc_token}/{filename}"


class KycDocument(models.Model):
    bank_account = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name="kyc_documents")
    file = models.FileField(upload_to=kyc_upload_path)
    label = models.CharField(max_length=160, blank=True)
    uploaded_by = models.CharField(max_length=160, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.bank_account_id} • {self.label or self.file.name}"


class ActivityLog(models.Model):
    actor = models.CharField(max_length=120)
    action = models.CharField(max_length=160)
    target = models.CharField(max_length=180)
    tone = models.CharField(max_length=40, default="success")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
