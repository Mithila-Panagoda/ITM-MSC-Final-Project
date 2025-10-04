from rest_framework_nested import routers
from django.contrib import admin
from django.urls import path, include
from drf_yasg import openapi
from drf_yasg.views import get_schema_view as swagger_get_shema_view
from django.conf import settings

schema_view = swagger_get_shema_view(
    openapi.Info(
        title="ITM-SDP-Assigment",
        default_version="v1",
        description="""
        API documentation for Shipment updates.

        ## WebSocket Endpoint
        - **URL**: `ws://<your-domain>/ws/shipment-updates/{tracking_id}/`
        - **Description**: Connect to this WebSocket endpoint to receive real-time shipment updates.
        - **Parameters**:
            - `tracking_id`: The ID of the shipment to receive updates for.
        """,
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="mithilapanagoda@gmail.com"),
    ),
    permission_classes=(),
    public=settings.IS_SWAGGER_ENABLED,
)


urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "swagger/schema/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
]

apps = [
    "apps.users",
    "apps.charity",
    "apps.on_chain",
]

for app in apps:
    try:
        urlpatterns.append(path("api/", include(f"{app}.urls")))
    except ImportError as e:
        print(f"WARNING:{e}.")
