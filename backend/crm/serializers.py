from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import ActivityLog, Agent, BankAccount, KycDocument, Merchant, Profile


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identifier = attrs["email"].strip()
        user = authenticate(username=identifier, password=attrs["password"])
        if not user and "@" not in identifier:
            try:
                match = User.objects.get(email__iexact=identifier)
                user = authenticate(username=match.username, password=attrs["password"])
            except User.DoesNotExist:
                user = None
        if not user and "@" in identifier:
            try:
                match = User.objects.get(email__iexact=identifier)
                user = authenticate(username=match.username, password=attrs["password"])
            except User.DoesNotExist:
                user = None
        if not user:
            raise serializers.ValidationError("Invalid username or password")
        refresh = RefreshToken.for_user(user)
        profile = getattr(user, "profile", None)
        attrs["token"] = str(refresh.access_token)
        attrs["refresh"] = str(refresh)
        attrs["user"] = {
            "id": user.id,
            "name": user.get_full_name() or user.username,
            "email": user.email,
            "role": profile.role if profile else "Admin",
            "mobile": profile.mobile if profile else "",
        }
        return attrs


def create_user(username, password, name="", email=""):
    user = User.objects.create_user(username=username, email=email or "", password=password)
    if name:
        first, *rest = name.split(" ")
        user.first_name = first
        user.last_name = " ".join(rest)
        user.save()
    return user


class AgentSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    name = serializers.SerializerMethodField()
    email = serializers.CharField(source="user.email", required=False, allow_blank=True)
    username = serializers.CharField(source="user.username", required=False)
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, min_length=4)
    last_password = serializers.CharField(source="user.profile.last_password", read_only=True)
    mobile = serializers.CharField(required=False, allow_blank=True, max_length=40)
    whatsapp = serializers.CharField(required=False, allow_blank=True, max_length=40)
    telegram = serializers.CharField(required=False, allow_blank=True, max_length=80)
    address = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    merchants = serializers.IntegerField(source="merchants.count", read_only=True)
    accounts = serializers.IntegerField(source="bank_accounts.count", read_only=True)

    class Meta:
        model = Agent
        fields = ["id", "name", "username", "full_name", "email", "password", "last_password", "mobile", "whatsapp", "telegram", "address", "notes", "status", "merchants", "accounts"]

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def validate(self, attrs):
        user_data = attrs.get("user", {})
        username = (user_data.get("username") or "").strip()
        email = (user_data.get("email") or "").strip()
        if not self.instance and not username and not email:
            raise serializers.ValidationError({"username": "Username is required"})
        login_id = username or email
        if login_id:
            qs = User.objects.filter(username__iexact=login_id)
            if email:
                qs = qs | User.objects.filter(email__iexact=email)
            if self.instance:
                qs = qs.exclude(pk=self.instance.user_id)
            if qs.exists():
                raise serializers.ValidationError({"username": "A user with this username or email already exists"})
        return attrs

    def create(self, validated_data):
        user_data = validated_data.pop("user", {})
        username = (user_data.get("username") or "").strip()
        email = (user_data.get("email") or "").strip()
        login_id = username or email or ""
        name = validated_data.pop("full_name", "")
        password = validated_data.pop("password", "demo1234")
        user = create_user(login_id, password, name=name, email=email)
        Profile.objects.create(
            user=user,
            role="Agent",
            mobile=validated_data.get("mobile", ""),
            whatsapp=validated_data.get("whatsapp", ""),
            last_password=password,
        )
        return Agent.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        name = validated_data.pop("full_name", None)
        password = validated_data.pop("password", None)
        if name:
            first, *rest = name.split(" ")
            instance.user.first_name = first
            instance.user.last_name = " ".join(rest)
        if "username" in user_data and user_data["username"]:
            instance.user.username = user_data["username"].strip()
        if "email" in user_data:
            instance.user.email = user_data["email"] or ""
        if password:
            instance.user.set_password(password)
            profile = getattr(instance.user, "profile", None)
            if profile is None:
                profile = Profile.objects.create(user=instance.user, role="Agent")
            profile.last_password = password
            profile.save(update_fields=["last_password"])
        instance.user.save()
        return super().update(instance, validated_data)


class MerchantSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    name = serializers.SerializerMethodField()
    email = serializers.CharField(source="user.email", required=False, allow_blank=True)
    username = serializers.CharField(source="user.username", required=False)
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, min_length=4)
    last_password = serializers.CharField(source="user.profile.last_password", read_only=True)
    agent_name = serializers.CharField(source="agent.name", read_only=True)
    agent_id = serializers.PrimaryKeyRelatedField(source="agent", queryset=Agent.objects.all(), required=False, allow_null=True)
    city = serializers.CharField(required=False, allow_blank=True, max_length=100)
    volume = serializers.CharField(required=False, allow_blank=True, max_length=40)
    accounts = serializers.IntegerField(source="bank_accounts.count", read_only=True)

    class Meta:
        model = Merchant
        fields = ["id", "name", "username", "full_name", "email", "password", "last_password", "agent_id", "agent_name", "city", "volume", "status", "accounts"]

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def validate(self, attrs):
        user_data = attrs.get("user", {})
        username = (user_data.get("username") or "").strip()
        email = (user_data.get("email") or "").strip()
        if not self.instance and not username and not email:
            raise serializers.ValidationError({"username": "Username is required"})
        login_id = username or email
        if login_id:
            qs = User.objects.filter(username__iexact=login_id)
            if email:
                qs = qs | User.objects.filter(email__iexact=email)
            if self.instance:
                qs = qs.exclude(pk=self.instance.user_id)
            if qs.exists():
                raise serializers.ValidationError({"username": "A user with this username or email already exists"})
        return attrs

    def create(self, validated_data):
        user_data = validated_data.pop("user", {})
        username = (user_data.get("username") or "").strip()
        email = (user_data.get("email") or "").strip()
        login_id = username or email or ""
        name = validated_data.pop("full_name", "")
        password = validated_data.pop("password", "demo1234")
        user = create_user(login_id, password, name=name, email=email)
        Profile.objects.create(user=user, role="Merchant", last_password=password)
        return Merchant.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        name = validated_data.pop("full_name", None)
        password = validated_data.pop("password", None)
        if name:
            first, *rest = name.split(" ")
            instance.user.first_name = first
            instance.user.last_name = " ".join(rest)
        if "username" in user_data and user_data["username"]:
            instance.user.username = user_data["username"].strip()
        if "email" in user_data:
            instance.user.email = user_data["email"] or ""
        if password:
            instance.user.set_password(password)
            profile = getattr(instance.user, "profile", None)
            if profile is None:
                profile = Profile.objects.create(user=instance.user, role="Merchant")
            profile.last_password = password
            profile.save(update_fields=["last_password"])
        instance.user.save()
        return super().update(instance, validated_data)


class KycDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    filename = serializers.SerializerMethodField()

    class Meta:
        model = KycDocument
        fields = ["id", "label", "uploaded_by", "uploaded_at", "file", "file_url", "filename"]
        read_only_fields = ["id", "uploaded_at", "file_url", "filename"]

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url

    def get_filename(self, obj):
        if not obj.file:
            return ""
        return obj.file.name.rsplit("/", 1)[-1]


class BankAccountSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source="agent.name", read_only=True)
    merchant_name = serializers.CharField(source="merchant.name", read_only=True)
    kyc_token = serializers.UUIDField(read_only=True)
    kyc_documents = KycDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = BankAccount
        fields = "__all__"


class ActivityLogSerializer(serializers.ModelSerializer):
    time = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = ["id", "actor", "action", "target", "tone", "time", "created_at"]

    def get_time(self, obj):
        return obj.created_at.strftime("%d %b %I:%M %p")


class ProfileSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False)
    mobile = serializers.CharField(required=False, allow_blank=True, max_length=40)
    whatsapp = serializers.CharField(required=False, allow_blank=True, max_length=40)
    telegram = serializers.CharField(required=False, allow_blank=True, max_length=80)
    address = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    @staticmethod
    def from_user(user, profile=None, contact_source=None):
        source = contact_source or profile
        return {
            "id": user.id,
            "name": user.get_full_name() or user.username,
            "email": user.email,
            "role": profile.role if profile else "Admin",
            "mobile": getattr(source, "mobile", "") or "",
            "whatsapp": getattr(source, "whatsapp", "") or "",
            "telegram": getattr(source, "telegram", "") or "",
            "address": getattr(source, "address", "") or "",
            "notes": getattr(source, "notes", "") or "",
        }
