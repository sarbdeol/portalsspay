from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from crm.models import Agent, BankAccount, Merchant, Profile


class Command(BaseCommand):
    help = "Seed demo admin, agent, merchant, and bank account data."

    def handle(self, *args, **options):
        admin, _ = User.objects.get_or_create(username="admin@rdlink.online", defaults={"email": "admin@rdlink.online", "first_name": "Ananya", "last_name": "Rao"})
        admin.email = "admin@rdlink.online"
        admin.set_password("demo1234")
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()
        Profile.objects.get_or_create(user=admin, defaults={"role": "Admin", "mobile": "+91 98765 10001"})

        agent_user, _ = User.objects.get_or_create(username="agent@rdlink.online", defaults={"email": "agent@rdlink.online", "first_name": "Rohan", "last_name": "Mehta"})
        agent_user.email = "agent@rdlink.online"
        agent_user.set_password("demo1234")
        agent_user.save()
        Profile.objects.get_or_create(user=agent_user, defaults={"role": "Agent", "mobile": "+91 98765 10002"})
        agent, _ = Agent.objects.get_or_create(user=agent_user, defaults={"mobile": "+91 98765 10002", "whatsapp": "+91 98765 10002", "telegram": "@rohan_rd", "address": "Bandra West, Mumbai"})

        merchant_user, _ = User.objects.get_or_create(username="merchant@rdlink.online", defaults={"email": "merchant@rdlink.online", "first_name": "Kavya", "last_name": "Traders"})
        merchant_user.email = "merchant@rdlink.online"
        merchant_user.set_password("demo1234")
        merchant_user.save()
        Profile.objects.get_or_create(user=merchant_user, defaults={"role": "Merchant", "mobile": "+91 98765 10003"})
        merchant, _ = Merchant.objects.get_or_create(user=merchant_user, defaults={"agent": agent, "city": "Mumbai", "volume": "₹42.8L"})

        BankAccount.objects.get_or_create(
            account_number="50100239481129",
            defaults={
                "bank_name": "HDFC Bank",
                "holder_name": "Kavya Traders",
                "ifsc": "HDFC0000485",
                "branch": "Bandra West",
                "account_type": "Current",
                "upi_id": "kavyatraders@hdfcbank",
                "upi_app": "PhonePe",
                "upi_mobile": "+91 98765 10003",
                "username": "kavya.ops",
                "password": "RDLink@9921",
                "transaction_password": "Txn@4921",
                "mpin": "4821",
                "tpin": "8821",
                "daily_limit": 500000,
                "monthly_limit": 9000000,
                "current_usage": 1740000,
                "status": "Active",
                "priority": "High",
                "registered_mobile": "+91 98765 10003",
                "recovery_email": "finance@kavya.in",
                "whatsapp": "+91 98765 10002",
                "login_url": "https://netbanking.hdfcbank.com/netbanking/",
                "agent": agent,
                "merchant": merchant,
                "tags": ["priority", "settlement"],
            },
        )
        self.stdout.write(self.style.SUCCESS("Demo backend data seeded."))
