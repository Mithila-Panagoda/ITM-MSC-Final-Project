#!/usr/bin/env python3
"""
Management command to process existing completed campaign events that don't have transaction hashes
"""

from django.core.management.base import BaseCommand
from apps.charity.models import CampaignEvent, CampaignEventStatus
from apps.charity.signals import handle_campaign_event_status_change


class Command(BaseCommand):
    help = 'Process existing completed campaign events that don\'t have transaction hashes'

    def handle(self, *args, **options):
        self.stdout.write("Processing existing completed campaign events...")
        
        # Find completed events without transaction hashes
        events_to_process = CampaignEvent.objects.filter(
            status=CampaignEventStatus.COMPLETED,
            transaction_hash__isnull=True
        )
        
        self.stdout.write(f"Found {events_to_process.count()} events to process")
        
        for event in events_to_process:
            self.stdout.write(f"Processing event: {event.title} (ID: {event.id})")
            
            # Check if campaign has on_chain_id
            if not event.campaign.on_chain_id:
                self.stdout.write(f"  Skipping - Campaign {event.campaign.id} not registered on blockchain")
                continue
            
            # Manually trigger the signal logic
            try:
                from apps.on_chain.blockchain_service import blockchain_service
                
                if blockchain_service.is_configured:
                    # Convert amount to cents for blockchain
                    amount_usd_cents = int(float(event.amount) * 100)
                    
                    # Create campaign event on blockchain
                    tx_hash = blockchain_service.create_campaign_event_on_chain(
                        campaign_on_chain_id=event.campaign.on_chain_id,
                        amount_usd=amount_usd_cents,
                        title=event.title,
                        description=event.description
                    )
                    
                    # Update the event with transaction hash
                    event.transaction_hash = tx_hash
                    event.save(update_fields=['transaction_hash'])
                    
                    self.stdout.write(f"  ✅ Created blockchain transaction: {tx_hash}")
                else:
                    self.stdout.write(f"  ⚠️  Blockchain not configured, skipping")
                    
            except Exception as e:
                self.stdout.write(f"  ❌ Error: {str(e)}")
        
        self.stdout.write("Processing complete!")
