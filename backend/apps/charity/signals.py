from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from django.utils import timezone
from .models import Donation, DonationStatus, Campaign, CampaignStatus, CampaignEvent, CampaignEventStatus


def update_campaign_status_and_amount(campaign):
    """
    Update campaign's raised_amount and status based on donations and time.
    """
    # Calculate total raised amount from all COMPLETED donations
    # Only count donations that have an amount (USD donations)
    total_raised = campaign.donations.filter(
        status=DonationStatus.COMPLETED,
        amount__isnull=False
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


@receiver(post_save, sender=CampaignEvent)
def handle_campaign_event_status_change(sender, instance, created, **kwargs):
    """
    Handle campaign event status changes and trigger blockchain transactions.
    When status changes to COMPLETED, make on-chain call to create campaign event.
    """
    print(f"CampaignEvent signal triggered: created={created}, status={instance.status}, tx_hash={instance.transaction_hash}")
    
    if not created and instance.status == CampaignEventStatus.COMPLETED and not instance.transaction_hash:
        # Only process if this is a status change to COMPLETED, not a new creation, and no transaction hash yet
        print(f"Processing campaign event {instance.id} for blockchain transaction")
        try:
            from apps.on_chain.blockchain_service import blockchain_service
            
            if blockchain_service.is_configured:
                # Check if campaign has on_chain_id
                if not instance.campaign.on_chain_id:
                    print(f"Campaign {instance.campaign.id} not registered on blockchain, skipping event creation")
                    return
                
                # Convert amount to cents for blockchain
                amount_usd_cents = int(float(instance.amount) * 100)
                
                # Create campaign event on blockchain
                tx_hash = blockchain_service.create_campaign_event_on_chain(
                    campaign_on_chain_id=instance.campaign.on_chain_id,
                    amount_usd=amount_usd_cents,
                    title=instance.title,
                    description=instance.description
                )
                
                # Update the event with transaction hash using bulk_update to avoid signals
                from django.db import transaction
                with transaction.atomic():
                    CampaignEvent.objects.filter(id=instance.id).update(transaction_hash=tx_hash)
                
                print(f"Campaign event {instance.id} created on blockchain with TX {tx_hash}")
            else:
                print(f"Blockchain not configured, skipping campaign event {instance.id}")
                
        except Exception as e:
            print(f"Failed to create campaign event on blockchain: {str(e)}")
            # Log the error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Campaign event blockchain transaction failed for {instance.id}: {str(e)}")
            # Don't change the status back - let admin handle it


