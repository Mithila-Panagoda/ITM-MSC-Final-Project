from rest_framework import serializers
from .models import User

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class WalletLoginSerializer(serializers.Serializer):
    wallet_address = serializers.CharField(max_length=255)
    # Email is optional for existing users; required only when creating a new wallet user
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    
    def validate_wallet_address(self, value):
        """Validate wallet address format (basic Ethereum address validation)"""
        if not value.startswith('0x') or len(value) != 42:
            raise serializers.ValidationError("Invalid wallet address format")
        return value
    
    def validate_email(self, value):
        """Validate email is not already taken by non-wallet users when provided"""
        if not value:
            return value
        existing_user = User.objects.filter(email=value, auth_type='EMAIL').first()
        if existing_user:
            raise serializers.ValidationError("Email is already registered with traditional login")
        return value

class WalletRegisterSerializer(serializers.ModelSerializer):
    wallet_address = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    
    class Meta:
        model = User
        fields = ['wallet_address', 'email', 'first_name', 'last_name']
    
    def validate_wallet_address(self, value):
        """Validate wallet address format and uniqueness"""
        if not value.startswith('0x') or len(value) != 42:
            raise serializers.ValidationError("Invalid wallet address format")
        
        if User.objects.filter(wallet_address=value).exists():
            raise serializers.ValidationError("Wallet address is already registered")
        return value
    
    def validate_email(self, value):
        """Validate email is not already taken by non-wallet users"""
        existing_user = User.objects.filter(email=value, auth_type='EMAIL').first()
        if existing_user:
            raise serializers.ValidationError("Email is already registered with traditional login")
        return value
    
    def create(self, validated_data):
        """Create user with wallet authentication"""
        wallet_address = validated_data.pop('wallet_address')
        email = validated_data['email']
        
        # Set username to email and auth_type to WALLET
        validated_data['username'] = email
        validated_data['auth_type'] = 'WALLET'
        validated_data['wallet_address'] = wallet_address
        
        return super().create(validated_data)
    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        exclude = ['password']
