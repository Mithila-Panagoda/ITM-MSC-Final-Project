from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CharityViewSet, CampaignViewSet, DonationViewSet, CampaignEventViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r"charities", CharityViewSet, basename="charity")
router.register(r"campaigns", CampaignViewSet, basename="campaign")
router.register(r"donations", DonationViewSet, basename="donation")
router.register(r"campaign-events", CampaignEventViewSet, basename="campaign-event")

urlpatterns = [
    path("", include(router.urls)),
]

# Additional custom URL patterns can be added here if needed
# For example, if you want specific endpoints outside the viewset pattern:
# urlpatterns += [
#     path('api/custom-endpoint/', custom_view, name='custom-endpoint'),
# ]
