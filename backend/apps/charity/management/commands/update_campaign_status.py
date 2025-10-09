from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.charity.models import Campaign, CampaignStatus


class Command(BaseCommand):
    help = 'Update campaign statuses based on current time and goal achievement'

    def handle(self, *args, **options):
        now = timezone.now()
        updated_count = 0

        for campaign in Campaign.objects.all():
            old_status = campaign.status
            
            # Update status based on time and goal achievement
            if campaign.raised_amount >= campaign.goal_amount:
                campaign.status = CampaignStatus.COMPLETED
            elif now < campaign.start_date:
                campaign.status = CampaignStatus.UPCOMING
            elif campaign.start_date <= now <= campaign.end_date:
                campaign.status = CampaignStatus.ACTIVE
            else:
                campaign.status = CampaignStatus.ENDED
            
            if old_status != campaign.status:
                campaign.save(update_fields=['status'])
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Updated campaign "{campaign.title}" from {old_status} to {campaign.status}'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated_count} campaigns')
        )
