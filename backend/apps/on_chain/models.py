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
