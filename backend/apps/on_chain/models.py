import uuid

from django.db import models


class Token(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    token_id = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    value_fiat_lkr = models.DecimalField(max_digits=20, decimal_places=2)
    charity = models.ForeignKey(
        "charity.Charity", related_name="tokens", on_delete=models.CASCADE
    )

    def __str__(self):
        return f"{self.name} ({self.token_id})"


class OnChainTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction_hash = models.CharField(max_length=255, unique=True)
    token = models.ForeignKey(
        Token, related_name="transactions", on_delete=models.CASCADE
    )
    from_address = models.CharField(max_length=255)
    to_address = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Transaction {self.transaction_hash} - {self.amount} tokens"


class OnChainCampaignEvent(models.Model):
    """On-chain version of CampaignEvent with blockchain tracking"""
    campaign_event = models.OneToOneField(
        "charity.CampaignEvent", 
        related_name="on_chain_data", 
        on_delete=models.CASCADE
    )
    transaction_hash = models.CharField(max_length=255, unique=True, null=True, blank=True)
    blockchain_timestamp = models.DateTimeField(null=True, blank=True)
    is_on_chain = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "On-Chain Campaign Event"
        verbose_name_plural = "On-Chain Campaign Events"

    def __str__(self):
        return f"OnChain {self.campaign_event.title} - {self.campaign_event.campaign.title}"

    def save(self, *args, **kwargs):
        # Set is_on_chain to True if transaction_hash is provided
        if self.transaction_hash and not self.is_on_chain:
            self.is_on_chain = True
        super().save(*args, **kwargs)

    @property
    def title(self):
        """Access title from the related CampaignEvent"""
        return self.campaign_event.title

    @property
    def campaign(self):
        """Access campaign from the related CampaignEvent"""
        return self.campaign_event.campaign

    @property
    def amount(self):
        """Access amount from the related CampaignEvent"""
        return self.campaign_event.amount
