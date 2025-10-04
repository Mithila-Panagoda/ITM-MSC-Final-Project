from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("api/", include(router.urls)),
]
