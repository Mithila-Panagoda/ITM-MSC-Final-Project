from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Charity, Campaign, Donation, DonationStatus

User = get_user_model()


class CharitySerializer(serializers.ModelSerializer):
    """Serializer for Charity model"""

    campaigns_count = serializers.SerializerMethodField()
    total_raised = serializers.SerializerMethodField()

    class Meta:
        model = Charity
        fields = [
            "id",
            "name",
            "description",
            "website",
            "contact_email",
            "contract_address",
            "deployment_hash",
            "created_at",
            "updated_at",
            "campaigns_count",
            "total_raised",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "campaigns_count",
            "total_raised",
        ]

    def get_campaigns_count(self, obj):
        """Get total number of campaigns for this charity"""
        return obj.campaigns.count()

    def get_total_raised(self, obj):
        """Get total amount raised across all campaigns"""
        total = sum([campaign.raised_amount for campaign in obj.campaigns.all()])
        return float(total)


class CampaignListSerializer(serializers.ModelSerializer):
    """Serializer for Campaign list view (minimal fields)"""

    charity_name = serializers.CharField(source="charity.name", read_only=True)
    donations_count = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = [
            "id",
            "title",
            "description",
            "goal_amount",
            "raised_amount",
            "start_date",
            "end_date",
            "charity_name",
            "donations_count",
            "progress_percentage",
            "created_at",
        ]

    def get_donations_count(self, obj):
        """Get total number of donations for this campaign"""
        return obj.donations.filter(status=DonationStatus.COMPLETED).count()

    def get_progress_percentage(self, obj):
        """Calculate fundraising progress percentage"""
        if obj.goal_amount > 0:
            return round((float(obj.raised_amount) / float(obj.goal_amount)) * 100, 2)
        return 0


class CampaignSerializer(serializers.ModelSerializer):
    """Serializer for Campaign detail view"""

    charity = CharitySerializer(read_only=True)
    charity_id = serializers.UUIDField(write_only=True)
    donations_count = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    recent_donations = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = [
            "id",
            "contract_address",
            "charity",
            "charity_id",
            "title",
            "description",
            "goal_amount",
            "raised_amount",
            "start_date",
            "end_date",
            "deployment_hash",
            "created_at",
            "updated_at",
            "donations_count",
            "progress_percentage",
            "recent_donations",
        ]
        read_only_fields = ["id", "raised_amount", "created_at", "updated_at"]

    def get_donations_count(self, obj):
        """Get total number of completed donations"""
        return obj.donations.filter(status=DonationStatus.COMPLETED).count()

    def get_progress_percentage(self, obj):
        """Calculate fundraising progress percentage"""
        if obj.goal_amount > 0:
            return round((float(obj.raised_amount) / float(obj.goal_amount)) * 100, 2)
        return 0

    def get_recent_donations(self, obj):
        """Get last 5 completed donations"""
        recent = obj.donations.filter(status=DonationStatus.COMPLETED).order_by(
            "-donation_timestamp"
        )[:5]
        return DonationSerializer(recent, many=True, context=self.context).data

    def validate(self, data):
        """Validate campaign data"""
        if data.get("end_date") and data.get("start_date"):
            if data["end_date"] <= data["start_date"]:
                raise serializers.ValidationError("End date must be after start date")

        if data.get("goal_amount") and data["goal_amount"] <= 0:
            raise serializers.ValidationError("Goal amount must be greater than 0")

        return data


# Import TokenSerializer from on_chain app to avoid duplication
from apps.on_chain.serializers import TokenSerializer


class DonationSerializer(serializers.ModelSerializer):
    """Serializer for Donation model"""

    user_email = serializers.CharField(source="user.email", read_only=True)
    user_first_name = serializers.CharField(source="user.first_name", read_only=True)
    user_last_name = serializers.CharField(source="user.last_name", read_only=True)
    campaign_title = serializers.CharField(source="campaign.title", read_only=True)
    charity_name = serializers.CharField(source="campaign.charity.name", read_only=True)
    token_details = TokenSerializer(source="token", read_only=True)

    class Meta:
        model = Donation
        fields = [
            "id",
            "user",
            "user_email",
            "user_first_name",
            "user_last_name",
            "campaign",
            "campaign_title",
            "charity_name",
            "amount",
            "token",
            "token_details",
            "token_quantity",
            "status",
            "donation_timestamp",
            "created_at",
        ]
        read_only_fields = ["id", "donation_timestamp", "created_at"]

    def validate(self, data):
        """Validate donation data"""
        amount = data.get("amount")
        token_quantity = data.get("token_quantity")

        if not amount and not token_quantity:
            raise serializers.ValidationError(
                "Either amount or token_quantity must be provided"
            )

        if amount and amount <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")

        if token_quantity and token_quantity <= 0:
            raise serializers.ValidationError("Token quantity must be greater than 0")

        return data


class DonationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating donations"""

    class Meta:
        model = Donation
        fields = ["campaign", "amount", "token", "token_quantity"]

    def validate(self, data):
        """Validate donation creation data"""
        amount = data.get("amount")
        token_quantity = data.get("token_quantity")

        if not amount and not token_quantity:
            raise serializers.ValidationError(
                "Either amount or token_quantity must be provided"
            )

        if amount and amount <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")

        if token_quantity and token_quantity <= 0:
            raise serializers.ValidationError("Token quantity must be greater than 0")

        return data

    def create(self, validated_data):
        """Create donation with current user and set status to completed"""
        validated_data["user"] = self.context["request"].user
        # Set status to COMPLETED since we're not doing actual payment processing
        validated_data["status"] = DonationStatus.COMPLETED
        return super().create(validated_data)
