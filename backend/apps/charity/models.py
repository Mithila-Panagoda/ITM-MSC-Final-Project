import uuid

from django.db import models
from django.core.exceptions import ValidationError
from django.db.models import Sum

from apps.users.models import User


class Charity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField()
    website = models.URLField(blank=True, null=True)
    contact_email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Blockchain integration fields
    on_chain_id = models.IntegerField(null=True, blank=True, unique=True)
    transaction_hash = models.CharField(
        max_length=255, unique=True, null=True, blank=True
    )

    def __str__(self):
        return self.name

    @property
    def charity_explorer_url(self):
        """Generate Sepolia Etherscan URL for charity registration transaction"""
        if self.transaction_hash:
            return f"https://sepolia.etherscan.io/tx/{self.transaction_hash}"
        return None

    # TODO: in chairty contract maintain arr of campaigns_addresses


class CampaignStatus(models.TextChoices):
    UPCOMING = "UPCOMING", "Upcoming"
    ACTIVE = "ACTIVE", "Active"
    COMPLETED = "COMPLETED", "Completed"
    ENDED = "ENDED", "Ended"


class Campaign(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    charity = models.ForeignKey(
        Charity, related_name="campaigns", on_delete=models.CASCADE
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    goal_amount = models.DecimalField(max_digits=10, decimal_places=2)
    raised_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(
        max_length=10, choices=CampaignStatus.choices, default=CampaignStatus.UPCOMING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Blockchain integration fields
    on_chain_id = models.IntegerField(null=True, blank=True, unique=True)
    transaction_hash = models.CharField(
        max_length=255, unique=True, null=True, blank=True
    )

    def __str__(self):
        return self.title

    @property
    def campaign_explorer_url(self):
        """Generate Sepolia Etherscan URL for campaign creation transaction"""
        if self.transaction_hash:
            return f"https://sepolia.etherscan.io/tx/{self.transaction_hash}"
        return None

    def is_active(self):
        """Check if campaign is currently active (not completed or ended)"""
        return self.status in [CampaignStatus.UPCOMING, CampaignStatus.ACTIVE]

    def can_accept_donations(self):
        """Check if campaign can accept new donations"""
        from django.utils import timezone
        now = timezone.now()
        return (
            self.status == CampaignStatus.ACTIVE and
            self.start_date <= now <= self.end_date and
            self.raised_amount < self.goal_amount
        )

    def update_status(self):
        """Update campaign status based on current time and goal achievement"""
        from django.utils import timezone
        now = timezone.now()
        
        if self.raised_amount >= self.goal_amount:
            self.status = CampaignStatus.COMPLETED
        elif now < self.start_date:
            self.status = CampaignStatus.UPCOMING
        elif self.start_date <= now <= self.end_date:
            self.status = CampaignStatus.ACTIVE
        else:
            self.status = CampaignStatus.ENDED
        
        self.save(update_fields=['status'])
        return self.status

    def get_remaining_amount(self):
        """Get the remaining amount needed to reach the goal"""
        return max(0, self.goal_amount - self.raised_amount)

    def can_accept_donation_amount(self, amount):
        """Check if a donation amount can be accepted without exceeding the goal"""
        return amount <= self.get_remaining_amount()


class DonationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    COMPLETED = "COMPLETED", "Completed"
    FAILED = "FAILED", "Failed"


class Donation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name="donations", on_delete=models.CASCADE)
    campaign = models.ForeignKey(
        Campaign, related_name="donations", on_delete=models.CASCADE
    )
    amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, default=0.00
    )
    token = models.ForeignKey(
        "on_chain.Token",
        related_name="donations",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    token_quantity = models.DecimalField(
        max_digits=20, decimal_places=8, null=True, blank=True, default=0.00
    )
    status = models.CharField(
        max_length=10, choices=DonationStatus.choices, default=DonationStatus.PENDING
    )
    donation_timestamp = models.DateTimeField(null=True, blank=True, auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Blockchain integration fields
    transaction_hash = models.CharField(max_length=255, null=True, blank=True, unique=True)

    @property
    def donation_explorer_url(self):
        """Generate Sepolia Etherscan URL for donation transaction"""
        if self.transaction_hash:
            return f"https://sepolia.etherscan.io/tx/{self.transaction_hash}"
        return None


class CampaignEventStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"


class CampaignEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(
        Campaign, related_name="events", on_delete=models.CASCADE
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to="campaign_events/", blank=True, null=True)
    event_date = models.DateTimeField()
    created_by = models.ForeignKey(
        User, related_name="created_events", on_delete=models.CASCADE
    )
    status = models.CharField(
        max_length=10, choices=CampaignEventStatus.choices, default=CampaignEventStatus.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-event_date"]
        verbose_name = "Campaign Event"
        verbose_name_plural = "Campaign Events"

    def __str__(self):
        return f"{self.title} - {self.campaign.title}"

    def clean(self):
        """Validate campaign event data"""
        super().clean()
        
        # Check if campaign is completed or ended
        if self.campaign_id and self.campaign.status not in [CampaignStatus.COMPLETED, CampaignStatus.ENDED]:
            raise ValidationError("Events can only be created for completed or ended campaigns.")
        
        # Check if amount is positive
        if self.amount <= 0:
            raise ValidationError("Amount must be greater than zero.")
        
        # Check if total allocated amount doesn't exceed raised amount
        if self.campaign_id:
            total_allocated = CampaignEvent.objects.filter(
                campaign=self.campaign,
                status__in=[CampaignEventStatus.PENDING, CampaignEventStatus.COMPLETED]
            ).exclude(id=self.id).aggregate(total=Sum('amount'))['total'] or 0
            
            if total_allocated + self.amount > self.campaign.raised_amount:
                raise ValidationError(
                    f"Total allocated amount ({total_allocated + self.amount}) cannot exceed "
                    f"campaign raised amount ({self.campaign.raised_amount})."
                )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    @classmethod
    def get_total_allocated_for_campaign(cls, campaign):
        """Get total allocated amount for a campaign"""
        return cls.objects.filter(
            campaign=campaign,
            status__in=[CampaignEventStatus.PENDING, CampaignEventStatus.COMPLETED]
        ).aggregate(total=Sum('amount'))['total'] or 0

    @classmethod
    def get_remaining_funds_for_campaign(cls, campaign):
        """Get remaining unallocated funds for a campaign"""
        total_allocated = cls.get_total_allocated_for_campaign(campaign)
        return max(0, campaign.raised_amount - total_allocated)

    @classmethod
    def get_utilization_percentage_for_campaign(cls, campaign):
        """Get fund utilization percentage for a campaign"""
        if campaign.raised_amount <= 0:
            return 0
        total_allocated = cls.get_total_allocated_for_campaign(campaign)
        return round((total_allocated / campaign.raised_amount) * 100, 2)
