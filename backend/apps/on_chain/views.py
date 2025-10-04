from django.shortcuts import render
from django.db.models import Sum, Count
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

from .models import Token, OnChainTransaction
from .serializers import (
    TokenSerializer,
    OnChainTransactionSerializer,
    TokenCreateSerializer,
    OnChainTransactionCreateSerializer,
)


class TokenViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tokens.
    Provides CRUD operations for token objects.
    """

    queryset = Token.objects.all().select_related("charity")
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "token_id", "charity__name"]
    ordering_fields = ["name", "token_id", "value_fiat_lkr"]
    ordering = ["name"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == "create":
            return TokenCreateSerializer
        return TokenSerializer

    def get_queryset(self):
        """Filter tokens based on query parameters"""
        queryset = super().get_queryset()

        # Filter by charity
        charity_id = self.request.query_params.get("charity", None)
        if charity_id:
            queryset = queryset.filter(charity_id=charity_id)

        return queryset

    @action(detail=True, methods=["get"])
    def transactions(self, request, pk=None):
        """Get all transactions for a specific token"""
        token = self.get_object()
        transactions = token.transactions.all().order_by("-timestamp")
        serializer = OnChainTransactionSerializer(
            transactions, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def statistics(self, request, pk=None):
        """Get statistics for a specific token"""
        token = self.get_object()

        total_transactions = token.transactions.count()
        total_volume = token.transactions.aggregate(total=Sum("amount"))["total"] or 0

        # Calculate unique addresses involved
        from_addresses = set(token.transactions.values_list("from_address", flat=True))
        to_addresses = set(token.transactions.values_list("to_address", flat=True))
        unique_addresses = len(from_addresses.union(to_addresses))

        stats = {
            "total_transactions": total_transactions,
            "total_volume": float(total_volume),
            "unique_addresses": unique_addresses,
            "token_value_lkr": float(token.value_fiat_lkr),
            "total_value_lkr": float(total_volume * token.value_fiat_lkr),
            "charity": token.charity.name,
        }

        return Response(stats)


class OnChainTransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing on-chain transactions.
    Provides CRUD operations for transaction objects.
    """

    queryset = OnChainTransaction.objects.all().select_related(
        "token", "token__charity"
    )
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["transaction_hash", "from_address", "to_address", "token__name"]
    ordering_fields = ["amount", "timestamp"]
    ordering = ["-timestamp"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == "create":
            return OnChainTransactionCreateSerializer
        return OnChainTransactionSerializer

    def get_queryset(self):
        """Filter transactions based on query parameters"""
        queryset = super().get_queryset()

        # Filter by token
        token_id = self.request.query_params.get("token", None)
        if token_id:
            queryset = queryset.filter(token_id=token_id)

        # Filter by charity
        charity_id = self.request.query_params.get("charity", None)
        if charity_id:
            queryset = queryset.filter(token__charity_id=charity_id)

        # Filter by address (either from or to)
        address = self.request.query_params.get("address", None)
        if address:
            from django.db.models import Q

            queryset = queryset.filter(
                Q(from_address__icontains=address) | Q(to_address__icontains=address)
            )

        return queryset

    @action(detail=False, methods=["get"])
    def by_address(self, request):
        """Get transactions for a specific address"""
        address = request.query_params.get("address", None)
        if not address:
            return Response(
                {"error": "Address parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.db.models import Q

        transactions = self.get_queryset().filter(
            Q(from_address__iexact=address) | Q(to_address__iexact=address)
        )

        serializer = self.get_serializer(transactions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def statistics(self, request):
        """Get overall transaction statistics"""
        queryset = self.get_queryset()

        total_transactions = queryset.count()
        total_volume = queryset.aggregate(total=Sum("amount"))["total"] or 0

        # Get transaction counts by token
        token_stats = (
            queryset.values("token__name")
            .annotate(count=Count("id"), volume=Sum("amount"))
            .order_by("-count")[:10]
        )  # Top 10 tokens by transaction count

        # Get unique addresses
        from_addresses = set(queryset.values_list("from_address", flat=True))
        to_addresses = set(queryset.values_list("to_address", flat=True))
        unique_addresses = len(from_addresses.union(to_addresses))

        stats = {
            "total_transactions": total_transactions,
            "total_volume": float(total_volume),
            "unique_addresses": unique_addresses,
            "top_tokens_by_transactions": list(token_stats),
        }

        return Response(stats)
