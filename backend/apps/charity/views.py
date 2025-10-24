from django.shortcuts import render
from django.db.models import Q, Sum, F
from django.utils import timezone
from django.db import transaction
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
import logging

from .models import Charity, Campaign, Donation, DonationStatus, CampaignEvent
from .serializers import (
    CharitySerializer,
    CampaignSerializer,
    CampaignListSerializer,
    DonationSerializer,
    DonationCreateSerializer,
    CampaignEventSerializer,
    CampaignEventListSerializer,
    CampaignEventCreateSerializer,
    CampaignUtilizationSerializer,
)
from apps.on_chain.blockchain_service import blockchain_service, BlockchainServiceError

logger = logging.getLogger(__name__)


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
    
    def perform_create(self, serializer):
        """Create charity and register it on the blockchain"""
        try:
            with transaction.atomic():
                # Save charity to database first
                charity = serializer.save()
                
                # Register on blockchain (only if blockchain is configured)
                from apps.on_chain.blockchain_service import blockchain_service
                if blockchain_service.is_configured:
                    try:
                        # Create metadata URI (simplified for now)
                        metadata_uri = f"https://api.example.com/charities/{charity.id}/metadata"
                        
                        # Use admin wallet address for all charity registrations
                        from django.conf import settings
                        admin_wallet = getattr(settings, 'ADMIN_WALLET_ADDRESS', '')
                        
                        on_chain_id, tx_hash = blockchain_service.register_charity_on_chain(
                            name=charity.name,
                            metadata_uri=metadata_uri,
                            wallet_address=admin_wallet
                        )
                        
                        # Update charity with blockchain data
                        charity.on_chain_id = on_chain_id
                        charity.transaction_hash = tx_hash
                        charity.save(update_fields=['on_chain_id', 'transaction_hash'])
                        
                        logger.info(f"Charity {charity.id} registered on blockchain with ID {on_chain_id}")
                        
                    except BlockchainServiceError as e:
                        logger.error(f"Failed to register charity on blockchain: {str(e)}")
                        # Rollback database transaction if blockchain fails
                        raise Exception(f"Blockchain registration failed: {str(e)}")
                else:
                    logger.info(f"Charity {charity.id} created without blockchain integration (blockchain not configured)")
                    
        except Exception as e:
            logger.error(f"Failed to create charity: {str(e)}")
            raise

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
    
    def perform_create(self, serializer):
        """Create campaign and register it on the blockchain"""
        try:
            with transaction.atomic():
                # Save campaign to database first
                campaign = serializer.save()
                
                # Check if blockchain is configured and charity has on_chain_id
                from apps.on_chain.blockchain_service import blockchain_service
                if blockchain_service.is_configured and not campaign.charity.on_chain_id:
                    raise ValueError("Charity must be registered on blockchain before creating campaigns")
                
                # Register on blockchain (only if blockchain is configured)
                if blockchain_service.is_configured:
                    try:
                        # Convert goal amount to wei (assuming USD, 1 USD = 1 ETH for simplicity)
                        from web3 import Web3
                        goal_amount_wei = Web3.to_wei(float(campaign.goal_amount), 'ether')
                        
                        # Convert timestamps
                        start_timestamp = int(campaign.start_date.timestamp())
                        end_timestamp = int(campaign.end_date.timestamp())
                        
                        on_chain_id, tx_hash = blockchain_service.create_campaign_on_chain(
                            charity_on_chain_id=campaign.charity.on_chain_id,
                            title=campaign.title,
                            description=campaign.description,
                            goal_amount_wei=goal_amount_wei,
                            start_timestamp=start_timestamp,
                            end_timestamp=end_timestamp
                        )
                        
                        # Update campaign with blockchain data
                        campaign.on_chain_id = on_chain_id
                        campaign.transaction_hash = tx_hash
                        campaign.save(update_fields=['on_chain_id', 'transaction_hash'])
                        
                        logger.info(f"Campaign {campaign.id} created on blockchain with ID {on_chain_id}")
                        
                    except BlockchainServiceError as e:
                        logger.error(f"Failed to create campaign on blockchain: {str(e)}")
                        # Rollback database transaction if blockchain fails
                        raise Exception(f"Blockchain campaign creation failed: {str(e)}")
                else:
                    logger.info(f"Campaign {campaign.id} created without blockchain integration (blockchain not configured)")
                    
        except Exception as e:
            logger.error(f"Failed to create campaign: {str(e)}")
            raise

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
            try:
                with transaction.atomic():
                    # Ensure the donation is for this campaign
                    serializer.validated_data["campaign"] = campaign
                    donation = serializer.save()
                    
                    # Record donation on blockchain (only if blockchain is configured)
                    from apps.on_chain.blockchain_service import blockchain_service
                    if blockchain_service.is_configured:
                        try:
                            if not campaign.on_chain_id:
                                raise ValueError("Campaign must be registered on blockchain before accepting donations")
                            
                            # Calculate proportional ETH amount: $100 = 0.001 ETH
                            from web3 import Web3
                            donation_amount_usd = float(donation.amount)
                            eth_amount = (donation_amount_usd / 100.0) * 0.001  # Scale: $100 = 0.001 ETH
                            amount_wei = Web3.to_wei(eth_amount, 'ether')
                            actual_amount_usd_cents = int(donation_amount_usd * 100)  # Convert to cents
                            
                            # Use user's wallet address if available, otherwise use admin wallet
                            donor_address = getattr(request.user, 'wallet_address', None)
                            if not donor_address:
                                from django.conf import settings
                                donor_address = getattr(settings, 'ADMIN_WALLET_ADDRESS', '')
                            
                            tx_hash = blockchain_service.donate_native_on_chain(
                                campaign_on_chain_id=campaign.on_chain_id,
                                amount_wei=amount_wei,
                                actual_amount_usd=actual_amount_usd_cents
                            )
                            
                            # Update donation with transaction hash and token quantity
                            donation.transaction_hash = tx_hash
                            donation.token_quantity = eth_amount  # Proportional ETH amount sent to blockchain
                            donation.save(update_fields=['transaction_hash', 'token_quantity'])
                            
                            logger.info(f"Donation {donation.id} recorded on blockchain with TX {tx_hash}")
                            
                        except BlockchainServiceError as e:
                            logger.error(f"Failed to record donation on blockchain: {str(e)}")
                            # Don't rollback database - donation exists but not on blockchain
                    else:
                        logger.info(f"Donation {donation.id} recorded without blockchain integration (blockchain not configured)")
                    
                    # Campaign raised amount will be updated automatically by Django signals
                    # No need to manually update it here
                    
                    response_serializer = DonationSerializer(
                        donation, context={"request": request}
                    )
                    return Response(response_serializer.data, status=status.HTTP_201_CREATED)
                    
            except Exception as e:
                logger.error(f"Failed to process donation: {str(e)}")
                return Response(
                    {"error": "Failed to process donation"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

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

    @action(detail=True, methods=["get"])
    def events(self, request, pk=None):
        """Get all events for a specific campaign"""
        campaign = self.get_object()
        
        # Only show events for completed/ended campaigns
        if campaign.status not in ["COMPLETED", "ENDED"]:
            return Response(
                {"error": "Events are only available for completed or ended campaigns"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        events = campaign.events.all().select_related("created_by")
        serializer = CampaignEventListSerializer(
            events, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def allocate_funds(self, request, pk=None):
        """Allocate funds for a specific campaign (create event)"""
        campaign = self.get_object()
        
        # Check if user is charity manager
        if request.user.role != "CHARITY_MANAGER":
            return Response(
                {"error": "Only charity managers can allocate campaign funds"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if campaign is completed or ended
        if campaign.status not in ["COMPLETED", "ENDED"]:
            return Response(
                {"error": "Funds can only be allocated for completed or ended campaigns"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = CampaignEventCreateSerializer(
            data=request.data, 
            context={"request": request, "campaign": campaign}
        )
        
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    event = serializer.save()
                    
                    # Campaign event is created in PENDING status
                    # Blockchain transaction will be triggered by signal when admin approves it
                    logger.info(f"Campaign event {event.id} created in PENDING status")
                    
                    response_serializer = CampaignEventSerializer(
                        event, context={"request": request}
                    )
                    return Response(response_serializer.data, status=status.HTTP_201_CREATED)
                    
            except Exception as e:
                logger.error(f"Failed to allocate funds: {str(e)}")
                return Response(
                    {"error": "Failed to allocate funds"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"])
    def utilization(self, request, pk=None):
        """Get fund utilization metrics for a specific campaign"""
        campaign = self.get_object()
        
        total_allocated = CampaignEvent.get_total_allocated_for_campaign(campaign)
        remaining_funds = CampaignEvent.get_remaining_funds_for_campaign(campaign)
        utilization_percentage = CampaignEvent.get_utilization_percentage_for_campaign(campaign)
        events_count = campaign.events.count()
        
        data = {
            "total_allocated": float(total_allocated),
            "remaining_funds": float(remaining_funds),
            "utilization_percentage": utilization_percentage,
            "events_count": events_count,
        }
        
        serializer = CampaignUtilizationSerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def all_transactions(self, request):
        """Get all blockchain transactions from donations, campaign events, etc."""
        from django.db.models import Q
        from .models import Donation, CampaignEvent
        from apps.on_chain.models import OnChainTransaction
        
        # Get query parameters
        search = request.query_params.get('search', '')
        token_filter = request.query_params.get('token', '')
        charity_filter = request.query_params.get('charity', '')
        address_filter = request.query_params.get('address', '')
        ordering = request.query_params.get('ordering', '-created_at')
        
        # Build base querysets
        charities = Charity.objects.filter(
            transaction_hash__isnull=False
        )
        
        campaigns = Campaign.objects.filter(
            transaction_hash__isnull=False
        ).select_related('charity')
        
        donations = Donation.objects.filter(
            transaction_hash__isnull=False
        ).select_related('campaign', 'campaign__charity', 'user')
        
        campaign_events = CampaignEvent.objects.filter(
            transaction_hash__isnull=False
        ).select_related('campaign', 'campaign__charity', 'created_by')
        
        on_chain_transactions = OnChainTransaction.objects.all().select_related('token', 'token__charity')
        
        # Apply filters
        if search:
            charities = charities.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
            campaigns = campaigns.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(charity__name__icontains=search)
            )
            donations = donations.filter(
                Q(campaign__title__icontains=search) |
                Q(campaign__charity__name__icontains=search) |
                Q(user__email__icontains=search)
            )
            campaign_events = campaign_events.filter(
                Q(title__icontains=search) |
                Q(campaign__title__icontains=search) |
                Q(campaign__charity__name__icontains=search)
            )
            on_chain_transactions = on_chain_transactions.filter(
                Q(token__name__icontains=search) |
                Q(token__charity__name__icontains=search)
            )
        
        if charity_filter:
            charities = charities.filter(id=charity_filter)
            campaigns = campaigns.filter(charity_id=charity_filter)
            donations = donations.filter(campaign__charity_id=charity_filter)
            campaign_events = campaign_events.filter(campaign__charity_id=charity_filter)
            on_chain_transactions = on_chain_transactions.filter(token__charity_id=charity_filter)
        
        if address_filter:
            # Charities and campaigns don't have created_by field, so skip address filtering for them
            donations = donations.filter(user__wallet_address__icontains=address_filter)
            campaign_events = campaign_events.filter(created_by__wallet_address__icontains=address_filter)
            on_chain_transactions = on_chain_transactions.filter(
                Q(from_address__icontains=address_filter) |
                Q(to_address__icontains=address_filter)
            )
        
        # Convert to unified format
        transactions = []
        
        # Add charity registrations
        for charity in charities:
            transactions.append({
                'id': f"charity_{charity.id}",
                'type': 'charity_registration',
                'transaction_hash': charity.transaction_hash,
                'amount': 0,
                'token_quantity': 0,
                'from_address': 'Admin',
                'to_address': 'Blockchain',
                'charity_name': charity.name,
                'campaign_title': '',
                'user_email': 'admin@system.com',  # Default admin email since no created_by field
                'timestamp': charity.created_at,
                'status': 'COMPLETED',
                'explorer_url': charity.charity_explorer_url,
            })
        
        # Add campaign creations
        for campaign in campaigns:
            transactions.append({
                'id': f"campaign_{campaign.id}",
                'type': 'campaign_creation',
                'transaction_hash': campaign.transaction_hash,
                'amount': float(campaign.goal_amount),
                'token_quantity': 0,
                'from_address': 'Admin',
                'to_address': 'Blockchain',
                'charity_name': campaign.charity.name,
                'campaign_title': campaign.title,
                'user_email': 'admin@system.com',  # Default admin email since no created_by field
                'timestamp': campaign.created_at,
                'status': 'COMPLETED',
                'explorer_url': campaign.campaign_explorer_url,
            })
        
        # Add donations
        for donation in donations:
            transactions.append({
                'id': f"donation_{donation.id}",
                'type': 'donation',
                'transaction_hash': donation.transaction_hash,
                'amount': float(donation.amount) if donation.amount else 0,
                'token_quantity': float(donation.token_quantity) if donation.token_quantity else 0,
                'from_address': getattr(donation.user, 'wallet_address', ''),
                'to_address': 'Campaign',
                'charity_name': donation.campaign.charity.name,
                'campaign_title': donation.campaign.title,
                'user_email': donation.user.email if donation.user else '',
                'timestamp': donation.donation_timestamp or donation.created_at,
                'status': donation.status,
                'explorer_url': donation.donation_explorer_url,
            })
        
        # Add campaign events
        for event in campaign_events:
            transactions.append({
                'id': f"event_{event.id}",
                'type': 'campaign_event',
                'transaction_hash': event.transaction_hash,
                'amount': float(event.amount),
                'token_quantity': 0,
                'from_address': 'Campaign',
                'to_address': 'Event',
                'charity_name': event.campaign.charity.name,
                'campaign_title': event.campaign.title,
                'user_email': event.created_by.email if event.created_by else '',
                'timestamp': event.created_at,
                'status': event.status,
                'explorer_url': event.event_explorer_url,
                'event_title': event.title,
            })
        
        # Add on-chain transactions
        for tx in on_chain_transactions:
            transactions.append({
                'id': f"onchain_{tx.id}",
                'type': 'on_chain',
                'transaction_hash': tx.transaction_hash,
                'amount': float(tx.amount),
                'token_quantity': float(tx.amount),
                'from_address': tx.from_address,
                'to_address': tx.to_address,
                'charity_name': tx.token.charity.name,
                'campaign_title': '',
                'user_email': '',
                'timestamp': tx.timestamp,
                'status': 'COMPLETED',
                'explorer_url': f"https://sepolia.etherscan.io/tx/{tx.transaction_hash}",
                'token_name': tx.token.name,
            })
        
        # Sort transactions
        if ordering.startswith('-'):
            field = ordering[1:]
            reverse = True
        else:
            field = ordering
            reverse = False
        
        transactions.sort(key=lambda x: x.get(field, ''), reverse=reverse)
        
        # Pagination
        page_size = 20
        start = (int(request.query_params.get('page', 1)) - 1) * page_size
        end = start + page_size
        
        paginated_transactions = transactions[start:end]
        
        return Response({
            'results': paginated_transactions,
            'count': len(transactions),
            'next': f"?page={int(request.query_params.get('page', 1)) + 1}" if end < len(transactions) else None,
            'previous': f"?page={int(request.query_params.get('page', 1)) - 1}" if int(request.query_params.get('page', 1)) > 1 else None,
        })


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


class CampaignEventViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing campaign events.
    Charity managers can create events for their campaigns.
    """

    serializer_class = CampaignEventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "campaign__title"]
    ordering_fields = ["amount", "event_date", "created_at"]
    ordering = ["-event_date"]

    def get_queryset(self):
        """Filter events based on campaign and permissions"""
        queryset = CampaignEvent.objects.all().select_related(
            "campaign", "campaign__charity", "created_by"
        )

        # Filter by campaign if provided
        campaign_id = self.request.query_params.get("campaign")
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)

        # Only show events for completed/ended campaigns
        queryset = queryset.filter(
            campaign__status__in=["COMPLETED", "ENDED"]
        )

        return queryset

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == "list":
            return CampaignEventListSerializer
        elif self.action == "create":
            return CampaignEventCreateSerializer
        return CampaignEventSerializer

    def perform_create(self, serializer):
        """Set the current user as the event creator"""
        serializer.save(created_by=self.request.user)

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ["create", "update", "partial_update", "destroy"]:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticatedOrReadOnly]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """Override create to add campaign context"""
        campaign_id = request.data.get("campaign")
        if not campaign_id:
            return Response(
                {"error": "Campaign ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            campaign = Campaign.objects.get(id=campaign_id)
        except Campaign.DoesNotExist:
            return Response(
                {"error": "Campaign not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if user is charity manager
        if request.user.role != "CHARITY_MANAGER":
            return Response(
                {"error": "Only charity managers can create campaign events"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if campaign is completed or ended
        if campaign.status not in ["COMPLETED", "ENDED"]:
            return Response(
                {"error": "Events can only be created for completed or ended campaigns"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(
            data=request.data, 
            context={"request": request, "campaign": campaign}
        )
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
