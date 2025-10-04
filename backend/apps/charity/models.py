import uuid

from django.db import models

from apps.users.models import User


class Charity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField()
    website = models.URLField(blank=True, null=True)
    contact_email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    contract_address = models.CharField(
        max_length=255, unique=True, null=True, blank=True
    )
    deployment_hash = models.CharField(
        max_length=255, unique=True, null=True, blank=True
    )

    def __str__(self):
        return self.name

    # TODO: in chairty contract maintain arr of campaigns_addresses


class Campaign(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract_address = models.CharField(max_length=255, unique=True)
    charity = models.ForeignKey(
        Charity, related_name="campaigns", on_delete=models.CASCADE
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    goal_amount = models.DecimalField(max_digits=10, decimal_places=2)
    raised_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    deployment_hash = models.CharField(
        max_length=255, unique=True, null=True, blank=True
    )

    def __str__(self):
        return self.title


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
