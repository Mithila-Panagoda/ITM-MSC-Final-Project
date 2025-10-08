from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from .models import Donation, DonationStatus


@receiver(post_save, sender=Donation)
def update_campaign_raised_amount_on_save(sender, instance, created, **kwargs):
    """
    Update campaign's raised_amount when a donation is created or updated.
    Only count COMPLETED donations.
    """
    campaign = instance.campaign
    
    # Calculate total raised amount from all COMPLETED donations
    total_raised = campaign.donations.filter(
        status=DonationStatus.COMPLETED
    ).aggregate(
        total=Sum('amount')
    )['total'] or 0
    
    # Update the campaign's raised_amount
    campaign.raised_amount = total_raised
    campaign.save(update_fields=['raised_amount'])


@receiver(post_delete, sender=Donation)
def update_campaign_raised_amount_on_delete(sender, instance, **kwargs):
    """
    Update campaign's raised_amount when a donation is deleted.
    """
    campaign = instance.campaign
    
    # Calculate total raised amount from all COMPLETED donations
    total_raised = campaign.donations.filter(
        status=DonationStatus.COMPLETED
    ).aggregate(
        total=Sum('amount')
    )['total'] or 0
    
    # Update the campaign's raised_amount
    campaign.raised_amount = total_raised
    campaign.save(update_fields=['raised_amount'])


