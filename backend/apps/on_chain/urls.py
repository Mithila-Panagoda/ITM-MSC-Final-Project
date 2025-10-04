from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TokenViewSet, OnChainTransactionViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r"tokens", TokenViewSet, basename="token")
router.register(r"transactions", OnChainTransactionViewSet, basename="transaction")

urlpatterns = [
    path("api/", include(router.urls)),
]

# Additional custom URL patterns can be added here if needed
# For example, if you want specific endpoints outside the viewset pattern:
# urlpatterns += [
#     path('api/blockchain-status/', blockchain_status_view, name='blockchain-status'),
# ]
