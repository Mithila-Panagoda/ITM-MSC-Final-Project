from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from django.utils import timezone
from .models import Donation, DonationStatus, Campaign, CampaignStatus


def update_campaign_status_and_amount(campaign):
    """
    Update campaign's raised_amount and status based on donations and time.
    """
    # Calculate total raised amount from all COMPLETED donations
    total_raised = campaign.donations.filter(
        status=DonationStatus.COMPLETED
    ).aggregate(
        total=Sum('amount')
    )['total'] or 0
    
    # Update the campaign's raised_amount
    campaign.raised_amount = total_raised
    
    # Update campaign status based on time and goal achievement
    now = timezone.now()
    
    if campaign.raised_amount >= campaign.goal_amount:
        # Goal reached - mark as completed
        campaign.status = CampaignStatus.COMPLETED
    elif now < campaign.start_date:
        # Campaign hasn't started yet
        campaign.status = CampaignStatus.UPCOMING
    elif campaign.start_date <= now <= campaign.end_date:
        # Campaign is currently active
        campaign.status = CampaignStatus.ACTIVE
    else:
        # Campaign has ended
        campaign.status = CampaignStatus.ENDED
    
    campaign.save(update_fields=['raised_amount', 'status'])


@receiver(post_save, sender=Donation)
def update_campaign_raised_amount_on_save(sender, instance, created, **kwargs):
    """
    Update campaign's raised_amount and status when a donation is created or updated.
    Only count COMPLETED donations.
    """
    campaign = instance.campaign
    update_campaign_status_and_amount(campaign)


@receiver(post_delete, sender=Donation)
def update_campaign_raised_amount_on_delete(sender, instance, **kwargs):
    """
    Update campaign's raised_amount and status when a donation is deleted.
    """
    campaign = instance.campaign
    update_campaign_status_and_amount(campaign)


@receiver(post_save, sender=Campaign)
def update_campaign_status_on_save(sender, instance, created, **kwargs):
    """
    Update campaign status when a campaign is created or updated.
    """
    # Only update status, not raised_amount (to avoid overriding donation calculations)
    now = timezone.now()
    old_status = instance.status
    
    if instance.raised_amount >= instance.goal_amount:
        # Goal reached - mark as completed
        new_status = CampaignStatus.COMPLETED
    elif now < instance.start_date:
        # Campaign hasn't started yet
        new_status = CampaignStatus.UPCOMING
    elif instance.start_date <= now <= instance.end_date:
        # Campaign is currently active
        new_status = CampaignStatus.ACTIVE
    else:
        # Campaign has ended
        new_status = CampaignStatus.ENDED
    
    # Only save if status actually changed to avoid infinite loops
    if new_status != old_status:
        instance.status = new_status
        instance.save(update_fields=['status'])


