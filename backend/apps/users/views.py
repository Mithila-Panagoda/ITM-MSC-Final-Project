from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from .serializers import LoginSerializer, UserSerializer, WalletLoginSerializer, WalletRegisterSerializer
from .models import User
from .permissions import AnonWriteOnly


class UserViewSet(ReadOnlyModelViewSet):
    """
    A viewset for viewing and editing user instances.
    Provides a login action to authenticate users and return JWT tokens.
    """

    tags = ["User"]
    serializer_class = UserSerializer
    queryset = User.objects.all()

    def get_permissions(self):
        if self.action in ["login", "wallet_login"]:
            permission_classes = [AnonWriteOnly]
        elif self.action == "me":
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action == "login":
            return LoginSerializer
        elif self.action == "wallet_login":
            return WalletLoginSerializer
        return UserSerializer

    @action(detail=False, methods=["post"], url_path="login")
    def login(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]
            user = authenticate(request, username=email, password=password)
            if user is not None:
                login(request, user)
                refresh = RefreshToken.for_user(user)
                return Response(
                    {
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                        "message": "Login successful",
                    },
                    status=status.HTTP_200_OK,
                )
            return Response(
                {"message": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        """
        Get the current authenticated user's information.
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="wallet-login")
    def wallet_login(self, request):
        """
        Authenticate user with wallet address and create/update user profile.
        """
        serializer = WalletLoginSerializer(data=request.data)
        if serializer.is_valid():
            wallet_address = serializer.validated_data['wallet_address']
            email = serializer.validated_data.get('email', '')
            first_name = serializer.validated_data.get('first_name', '')
            last_name = serializer.validated_data.get('last_name', '')
            
            # Check if user with this wallet address exists
            try:
                user = User.objects.get(wallet_address=wallet_address)
                # Update user profile if provided
                if first_name:
                    user.first_name = first_name
                if last_name:
                    user.last_name = last_name
                if email and user.email != email:
                    user.email = email
                    user.username = email
                user.save()
            except User.DoesNotExist:
                # Create new user
                if not email:
                    # Signal frontend that profile completion is required
                    return Response(
                        {
                            "requires_profile": True,
                            "message": "Profile completion required for new wallet user",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                user = User.objects.create(
                    wallet_address=wallet_address,
                    email=email,
                    username=email,
                    first_name=first_name,
                    last_name=last_name,
                    auth_type='WALLET',
                    role='USER'  # Default role for wallet users
                )
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "message": "Wallet login successful",
                },
                status=status.HTTP_200_OK,
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
