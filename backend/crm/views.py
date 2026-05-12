from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.db import IntegrityError
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import ActivityLog, Agent, BankAccount, KycDocument, Merchant, Profile
from .serializers import (
    ActivityLogSerializer,
    AgentSerializer,
    BankAccountSerializer,
    KycDocumentSerializer,
    LoginSerializer,
    MerchantSerializer,
    ProfileSerializer,
)


def log(actor, action, target):
    ActivityLog.objects.create(actor=actor, action=action, target=target)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    return Response({
        "access": serializer.validated_data["token"],
        "refresh": serializer.validated_data["refresh"],
        "user": serializer.validated_data["user"],
    })


CONTACT_FIELDS = ("mobile", "whatsapp", "telegram", "address", "notes")


def _safe_related(user, attr):
    """Reverse OneToOne access that returns None instead of raising DoesNotExist."""
    try:
        return getattr(user, attr)
    except Exception:
        return None


def _contact_source(user):
    """Return the row that owns contact fields for this user.

    Agents store contact on `Agent`; everyone else uses `Profile`.
    """
    agent = _safe_related(user, "agent_profile")
    if agent is not None:
        return agent
    return _safe_related(user, "profile")


@api_view(["GET", "PATCH"])
def me_view(request):
    user = request.user
    profile = _safe_related(user, "profile")
    source = _contact_source(user)
    if request.method == "GET":
        return Response(ProfileSerializer.from_user(user, profile, source))

    serializer = ProfileSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if "name" in data and data["name"].strip():
        first, *rest = data["name"].strip().split(" ")
        user.first_name = first
        user.last_name = " ".join(rest)
    if "email" in data and data["email"]:
        user.email = data["email"]
        user.username = data["email"]
    user.save()

    if profile is None:
        if _safe_related(user, "agent_profile") is not None:
            role = "Agent"
        elif _safe_related(user, "merchant_profile") is not None:
            role = "Merchant"
        else:
            role = "Admin"
        profile = Profile.objects.create(user=user, role=role)

    for field in CONTACT_FIELDS:
        if field in data:
            setattr(profile, field, data[field])
    profile.save()

    agent = _safe_related(user, "agent_profile")
    if agent is not None:
        for field in CONTACT_FIELDS:
            if field in data:
                setattr(agent, field, data[field])
        agent.save()

    log(user.email, "Updated profile", user.email)
    return Response(ProfileSerializer.from_user(user, profile, _contact_source(user)))


@api_view(["POST"])
def change_password_view(request):
    current = request.data.get("current_password", "")
    new = request.data.get("new_password", "")
    if len(new) < 4:
        return Response({"detail": "New password must be at least 4 characters"}, status=400)
    if not request.user.check_password(current):
        return Response({"detail": "Current password is incorrect"}, status=400)
    request.user.set_password(new)
    request.user.save()
    log(request.user.email, "Changed password", request.user.email)
    return Response({"detail": "Password updated"})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def forgot_password_view(request):
    email = request.data.get("email", "").strip().lower()
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({"detail": "If the email exists, a reset link has been generated"}, status=200)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    log("system", "Issued password reset token", email)
    # In production this would email a link; for this app we return it so the UI can show it.
    return Response({
        "detail": "Reset token generated",
        "uid": uid,
        "token": token,
    })


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def reset_password_view(request):
    uid = request.data.get("uid", "")
    token = request.data.get("token", "")
    new_password = request.data.get("new_password", "")
    if len(new_password) < 4:
        return Response({"detail": "New password must be at least 4 characters"}, status=400)
    try:
        user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
    except (User.DoesNotExist, ValueError, TypeError):
        return Response({"detail": "Invalid reset link"}, status=400)
    if not default_token_generator.check_token(user, token):
        return Response({"detail": "Reset link is invalid or expired"}, status=400)
    user.set_password(new_password)
    user.save()
    log("system", "Reset password via token", user.email)
    return Response({"detail": "Password reset"})


class BaseModelViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        try:
            instance = serializer.save()
        except IntegrityError as exc:
            raise ValidationError({"detail": str(exc)})
        log(self.request.user.email, f"Created {self.basename}", str(instance))

    def perform_update(self, serializer):
        try:
            instance = serializer.save()
        except IntegrityError as exc:
            raise ValidationError({"detail": str(exc)})
        log(self.request.user.email, f"Updated {self.basename}", str(instance))

    def perform_destroy(self, instance):
        target = str(instance)
        instance.delete()
        log(self.request.user.email, f"Deleted {self.basename}", target)

    @action(detail=True, methods=["post"])
    def toggle_status(self, request, pk=None):
        instance = self.get_object()
        instance.status = "Disabled" if instance.status == "Active" else "Active"
        instance.save()
        log(request.user.email, f"Toggled {self.basename} status", str(instance))
        return Response(self.get_serializer(instance).data)


class AgentViewSet(BaseModelViewSet):
    basename = "agent"
    queryset = Agent.objects.select_related("user").all()
    serializer_class = AgentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("mine") == "true":
            # Merchant view: their assigned agent only
            merchant = getattr(self.request.user, "merchant_profile", None)
            if merchant and merchant.agent_id:
                return qs.filter(pk=merchant.agent_id)
            return qs.none()
        return qs

    @action(detail=True, methods=["post"])
    def reset_password(self, request, pk=None):
        agent = self.get_object()
        password = request.data.get("password", "demo1234")
        agent.user.set_password(password)
        agent.user.save()
        profile = getattr(agent.user, "profile", None)
        if profile is None:
            profile = Profile.objects.create(user=agent.user, role="Agent")
        profile.last_password = password
        profile.save(update_fields=["last_password"])
        log(request.user.email, "Reset agent password", agent.name)
        return Response({"message": "Password reset", "temporary_password": password})


class MerchantViewSet(BaseModelViewSet):
    basename = "merchant"
    queryset = Merchant.objects.select_related("user", "agent").all()
    serializer_class = MerchantSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("mine") == "true":
            agent = getattr(self.request.user, "agent_profile", None)
            if agent:
                return qs.filter(agent=agent)
            return qs.none()
        return qs

    @action(detail=True, methods=["post"])
    def reset_password(self, request, pk=None):
        merchant = self.get_object()
        password = request.data.get("password", "demo1234")
        merchant.user.set_password(password)
        merchant.user.save()
        profile = getattr(merchant.user, "profile", None)
        if profile is None:
            profile = Profile.objects.create(user=merchant.user, role="Merchant")
        profile.last_password = password
        profile.save(update_fields=["last_password"])
        log(request.user.email, "Reset merchant password", merchant.name)
        return Response({"message": "Password reset", "temporary_password": password})


class BankAccountViewSet(BaseModelViewSet):
    basename = "bank account"
    queryset = BankAccount.objects.select_related("agent__user", "merchant__user").all()
    serializer_class = BankAccountSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("mine") == "true":
            agent = getattr(self.request.user, "agent_profile", None)
            merchant = getattr(self.request.user, "merchant_profile", None)
            if agent:
                return qs.filter(agent=agent)
            if merchant:
                return qs.filter(merchant=merchant)
            return qs.none()
        return qs

    def perform_create(self, serializer):
        # If an agent creates a bank account, auto-assign it to that agent
        # so they can see it without admin intervention.
        agent = getattr(self.request.user, "agent_profile", None)
        if agent is not None and not serializer.validated_data.get("agent"):
            serializer.validated_data["agent"] = agent
        super().perform_create(serializer)


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer


# ---------------------------------------------------------------
# Public KYC endpoints — accessed via a UUID token in the URL.
# Anyone with the link can fetch/upload. Admin/agent UI also reads
# documents via the authenticated bank-account endpoint.
# ---------------------------------------------------------------

MAX_KYC_UPLOAD_BYTES = 15 * 1024 * 1024  # 15 MB per file
ALLOWED_KYC_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic", ".doc", ".docx"}


def _bank_account_summary(account):
    return {
        "bank_name": account.bank_name,
        "holder_name": account.holder_name,
        "account_number_last4": (account.account_number or "")[-4:],
        "status": account.status,
    }


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def kyc_public_detail(request, token):
    try:
        account = BankAccount.objects.get(kyc_token=token)
    except (BankAccount.DoesNotExist, ValueError):
        return Response({"detail": "KYC link not found"}, status=404)
    documents = KycDocumentSerializer(
        account.kyc_documents.all(), many=True, context={"request": request}
    ).data
    return Response({"account": _bank_account_summary(account), "documents": documents})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def kyc_public_upload(request, token):
    try:
        account = BankAccount.objects.get(kyc_token=token)
    except (BankAccount.DoesNotExist, ValueError):
        return Response({"detail": "KYC link not found"}, status=404)

    upload = request.FILES.get("file")
    if not upload:
        return Response({"detail": "No file uploaded"}, status=400)
    if upload.size > MAX_KYC_UPLOAD_BYTES:
        return Response({"detail": f"File exceeds {MAX_KYC_UPLOAD_BYTES // (1024 * 1024)}MB limit"}, status=400)

    name = (upload.name or "").lower()
    ext = "." + name.rsplit(".", 1)[-1] if "." in name else ""
    if ext not in ALLOWED_KYC_EXTENSIONS:
        return Response({"detail": f"Unsupported file type ({ext or 'unknown'})"}, status=400)

    document = KycDocument.objects.create(
        bank_account=account,
        file=upload,
        label=request.data.get("label", "").strip()[:160],
        uploaded_by=request.data.get("uploaded_by", "").strip()[:160],
    )
    log("public", f"KYC upload for {account}", document.file.name)
    return Response(
        KycDocumentSerializer(document, context={"request": request}).data,
        status=201,
    )


@api_view(["DELETE"])
def kyc_document_delete(request, doc_id):
    try:
        document = KycDocument.objects.get(pk=doc_id)
    except KycDocument.DoesNotExist:
        return Response({"detail": "Document not found"}, status=404)
    target = f"{document.bank_account} • {document.file.name}"
    document.file.delete(save=False)
    document.delete()
    log(request.user.email, "Deleted KYC document", target)
    return Response({"detail": "Deleted"})
