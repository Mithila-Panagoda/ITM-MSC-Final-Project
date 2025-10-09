from django.shortcuts import render
from django.db.models import Q, Sum, F
from django.utils import timezone
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

from .models import Charity, Campaign, Donation, DonationStatus
from .serializers import (
    CharitySerializer,
    CampaignSerializer,
    CampaignListSerializer,
    DonationSerializer,
    DonationCreateSerializer,
)


class CharityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing charities.
    Provides CRUD operations for charity objects.
    """

    queryset = Charity.objects.all()
    serializer_class = CharitySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description", "contact_email"]
    ordering_fields = ["name", "created_at"]
    ordering = ["-created_at"]

    @action(detail=True, methods=["get"])
    def campaigns(self, request, pk=None):
        """Get all campaigns for a specific charity"""
        charity = self.get_object()
        campaigns = charity.campaigns.all()
        serializer = CampaignListSerializer(
            campaigns, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def donations(self, request, pk=None):
        """Get all donations for a specific charity"""
        charity = self.get_object()
        donations = Donation.objects.filter(campaign__charity=charity)
        serializer = DonationSerializer(
            donations, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def statistics(self, request, pk=None):
        """Get statistics for a specific charity"""
        charity = self.get_object()
        campaigns = charity.campaigns.all()

        total_campaigns = campaigns.count()
        active_campaigns = campaigns.filter(
            start_date__lte=timezone.now(), end_date__gte=timezone.now()
        ).count()

        total_raised = campaigns.aggregate(total=Sum("raised_amount"))["total"] or 0

        total_goal = campaigns.aggregate(total=Sum("goal_amount"))["total"] or 0

        completed_donations = Donation.objects.filter(
            campaign__charity=charity, status=DonationStatus.COMPLETED
        ).count()

        stats = {
            "total_campaigns": total_campaigns,
            "active_campaigns": active_campaigns,
            "total_raised": float(total_raised),
            "total_goal": float(total_goal),
            "progress_percentage": (
                round((float(total_raised) / float(total_goal)) * 100, 2)
                if total_goal > 0
                else 0
            ),
            "total_donations": completed_donations,
        }

        return Response(stats)


class CampaignViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing campaigns.
    Provides CRUD operations for campaign objects.
    """

    queryset = Campaign.objects.all().select_related("charity")
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "charity__name"]
    ordering_fields = [
        "title",
        "goal_amount",
        "raised_amount",
        "start_date",
        "end_date",
        "created_at",
    ]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == "list":
            return CampaignListSerializer
        return CampaignSerializer

    def get_queryset(self):
        """Filter campaigns based on query parameters"""
        queryset = super().get_queryset()

        # Filter by status
        status = self.request.query_params.get("status", None)
        if status:
            if status == "active":
                queryset = queryset.filter(status="ACTIVE")
            elif status == "upcoming":
                queryset = queryset.filter(status="UPCOMING")
            elif status == "ended":
                queryset = queryset.filter(status="ENDED")
            elif status == "completed":
                queryset = queryset.filter(status="COMPLETED")

        # Filter by fundraising progress
        progress = self.request.query_params.get("progress", None)
        if progress:
            if progress == "completed":
                queryset = queryset.filter(raised_amount__gte=F("goal_amount"))
            elif progress == "active":
                queryset = queryset.filter(raised_amount__lt=F("goal_amount"))

        return queryset

    @action(detail=True, methods=["get"])
    def donations(self, request, pk=None):
        """Get all donations for a specific campaign"""
        campaign = self.get_object()
        donations = campaign.donations.all().select_related("user", "token")
        serializer = DonationSerializer(
            donations, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def donate(self, request, pk=None):
        """Make a donation to a specific campaign"""
        campaign = self.get_object()
        
        # Ensure campaign status is up to date before checking if donations are allowed
        campaign.update_status()
        
        serializer = DonationCreateSerializer(
            data=request.data, context={"request": request}
        )

        if serializer.is_valid():
            # Ensure the donation is for this campaign
            serializer.validated_data["campaign"] = campaign
            donation = serializer.save()

            response_serializer = DonationSerializer(
                donation, context={"request": request}
            )
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"])
    def statistics(self, request, pk=None):
        """Get statistics for a specific campaign"""
        campaign = self.get_object()
        
        # Ensure campaign status is up to date
        campaign.update_status()

        completed_donations = campaign.donations.filter(status=DonationStatus.COMPLETED)
        total_donations = completed_donations.count()
        unique_donors = completed_donations.values("user").distinct().count()

        progress_percentage = 0
        if campaign.goal_amount > 0:
            progress_percentage = round(
                (float(campaign.raised_amount) / float(campaign.goal_amount)) * 100, 2
            )

        # Use the campaign's status field instead of calculating
        campaign_status = campaign.status.lower()

        from django.utils import timezone
        now = timezone.now()

        stats = {
            "total_donations": total_donations,
            "unique_donors": unique_donors,
            "goal_amount": float(campaign.goal_amount),
            "raised_amount": float(campaign.raised_amount),
            "progress_percentage": progress_percentage,
            "status": campaign_status,
            "days_remaining": (
                (campaign.end_date - now).days if campaign.end_date > now else 0
            ),
        }

        return Response(stats)


class DonationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing donations.
    Users can view their own donations and create new ones.
    """

    serializer_class = DonationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["campaign__title", "campaign__charity__name"]
    ordering_fields = ["amount", "token_quantity", "donation_timestamp", "created_at"]
    ordering = ["-donation_timestamp"]

    def get_queryset(self):
        """Users can only see their own donations"""
        # Handle swagger schema generation for anonymous users
        if getattr(self, "swagger_fake_view", False):
            return Donation.objects.none()

        if not self.request.user.is_authenticated:
            return Donation.objects.none()

        return Donation.objects.filter(user=self.request.user).select_related(
            "campaign", "campaign__charity", "token", "user"
        )

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == "create":
            return DonationCreateSerializer
        return DonationSerializer

    def perform_create(self, serializer):
        """Set the current user as the donation user"""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def my_statistics(self, request):
        """Get donation statistics for the current user"""
        user_donations = self.get_queryset().filter(status=DonationStatus.COMPLETED)

        total_donations = user_donations.count()
        total_amount = user_donations.aggregate(total=Sum("amount"))["total"] or 0

        campaigns_supported = user_donations.values("campaign").distinct().count()
        charities_supported = (
            user_donations.values("campaign__charity").distinct().count()
        )

        stats = {
            "total_donations": total_donations,
            "total_amount_donated": float(total_amount),
            "campaigns_supported": campaigns_supported,
            "charities_supported": charities_supported,
            "first_donation": (
                user_donations.order_by("donation_timestamp").first().donation_timestamp
                if user_donations.exists()
                else None
            ),
            "latest_donation": (
                user_donations.order_by("-donation_timestamp")
                .first()
                .donation_timestamp
                if user_donations.exists()
                else None
            ),
        }

        return Response(stats)
