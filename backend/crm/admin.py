from django.contrib import admin

from .models import ActivityLog, Agent, BankAccount, Merchant, Profile

admin.site.register(Profile)
admin.site.register(Agent)
admin.site.register(Merchant)
admin.site.register(BankAccount)
admin.site.register(ActivityLog)
