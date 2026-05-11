from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ActivityLogViewSet,
    AgentViewSet,
    BankAccountViewSet,
    MerchantViewSet,
    change_password_view,
    forgot_password_view,
    login_view,
    me_view,
    reset_password_view,
)

router = DefaultRouter()
router.register("agents", AgentViewSet)
router.register("merchants", MerchantViewSet)
router.register("bank-accounts", BankAccountViewSet)
router.register("activity-logs", ActivityLogViewSet)

urlpatterns = [
    path("auth/login/", login_view),
    path("auth/change-password/", change_password_view),
    path("auth/forgot-password/", forgot_password_view),
    path("auth/reset-password/", reset_password_view),
    path("me/", me_view),
    path("", include(router.urls)),
]
