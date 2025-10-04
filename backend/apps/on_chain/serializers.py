from rest_framework import serializers
from .models import Token, OnChainTransaction


class TokenSerializer(serializers.ModelSerializer):
    """Serializer for Token model"""

    charity_name = serializers.CharField(source="charity.name", read_only=True)
    transactions_count = serializers.SerializerMethodField()

    class Meta:
        model = Token
        fields = [
            "id",
            "token_id",
            "name",
            "description",
            "value_fiat_lkr",
            "charity",
            "charity_name",
            "transactions_count",
        ]
        read_only_fields = ["id"]

    def get_transactions_count(self, obj):
        """Get total number of transactions for this token"""
        return obj.transactions.count()

    def validate_value_fiat_lkr(self, value):
        """Validate token value"""
        if value <= 0:
            raise serializers.ValidationError("Token value must be greater than 0")
        return value


class OnChainTransactionSerializer(serializers.ModelSerializer):
    """Serializer for OnChainTransaction model"""

    token_name = serializers.CharField(source="token.name", read_only=True)
    token_symbol = serializers.CharField(source="token.token_id", read_only=True)
    charity_name = serializers.CharField(source="token.charity.name", read_only=True)

    class Meta:
        model = OnChainTransaction
        fields = [
            "id",
            "transaction_hash",
            "token",
            "token_name",
            "token_symbol",
            "charity_name",
            "from_address",
            "to_address",
            "amount",
            "timestamp",
        ]
        read_only_fields = ["id", "timestamp"]

    def validate_amount(self, value):
        """Validate transaction amount"""
        if value <= 0:
            raise serializers.ValidationError(
                "Transaction amount must be greater than 0"
            )
        return value

    def validate_transaction_hash(self, value):
        """Validate transaction hash format"""
        if not value.startswith("0x") or len(value) != 66:
            raise serializers.ValidationError("Invalid transaction hash format")
        return value


class TokenCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating tokens"""

    class Meta:
        model = Token
        fields = ["token_id", "name", "description", "value_fiat_lkr", "charity"]

    def validate_value_fiat_lkr(self, value):
        """Validate token value"""
        if value <= 0:
            raise serializers.ValidationError("Token value must be greater than 0")
        return value


class OnChainTransactionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating transactions"""

    class Meta:
        model = OnChainTransaction
        fields = ["transaction_hash", "token", "from_address", "to_address", "amount"]

    def validate_amount(self, value):
        """Validate transaction amount"""
        if value <= 0:
            raise serializers.ValidationError(
                "Transaction amount must be greater than 0"
            )
        return value

    def validate_transaction_hash(self, value):
        """Validate transaction hash format"""
        if not value.startswith("0x") or len(value) != 66:
            raise serializers.ValidationError("Invalid transaction hash format")
        return value
