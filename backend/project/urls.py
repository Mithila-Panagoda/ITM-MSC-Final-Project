from rest_framework_nested import routers
from django.contrib import admin
from django.urls import path, include
from drf_yasg import openapi
from drf_yasg.views import get_schema_view as swagger_get_shema_view
from django.conf import settings

schema_view = swagger_get_shema_view(
    openapi.Info(
        title="Blockchain-Integrated Charity Platform API",
        default_version="v1",
        description="""
        ## 🎯 Overview
        A comprehensive blockchain-integrated charity platform API that enables charity registration, campaign management, donation processing, and fund allocation with full blockchain transparency on Sepolia testnet.

        ## 🔗 Key Features
        - **Charity Management**: Register and manage charitable organizations
        - **Campaign System**: Create and manage fundraising campaigns
        - **Donation Processing**: Handle USD and ETH donations with blockchain recording
        - **Fund Allocation**: Allocate funds to campaign events with blockchain transactions
        - **User Management**: Role-based authentication (Donor, Charity Manager, Admin)
        - **Blockchain Integration**: Full Sepolia testnet integration with smart contracts

        ## 🔐 Authentication
        The API uses JWT-based authentication with role-based access control:
        - **DONOR**: Can make donations and view campaigns
        - **CHARITY_MANAGER**: Can create campaigns and allocate funds
        - **ADMIN**: Full system access and event approval

        ## 📊 Blockchain Integration
        - **Network**: Sepolia Testnet
        - **Explorer**: https://sepolia.etherscan.io
        - **Contract**: Deployed smart contract for all operations
        - **Transactions**: All operations recorded on blockchain

        ## 🚀 Quick Start
        1. **Authentication**: Login with email/password or wallet
        2. **Create Charity**: Register charitable organization
        3. **Create Campaign**: Set up fundraising campaign
        4. **Make Donations**: Process donations with blockchain recording
        5. **Allocate Funds**: Distribute funds to events

        ## 📝 API Endpoints

        ### Authentication
        - `POST /api/auth/login/` - User login
        - `POST /api/auth/logout/` - User logout
        - `POST /api/auth/refresh/` - Token refresh
        - `POST /api/auth/wallet-login/` - Wallet authentication

        ### Charities
        - `GET /api/charities/` - List charities
        - `POST /api/charities/` - Create charity (with blockchain registration)
        - `GET /api/charities/{id}/` - Get charity details
        - `PUT /api/charities/{id}/` - Update charity

        ### Campaigns
        - `GET /api/campaigns/` - List campaigns
        - `POST /api/campaigns/` - Create campaign (with blockchain registration)
        - `GET /api/campaigns/{id}/` - Get campaign details
        - `POST /api/campaigns/{id}/donate/` - Make donation (with blockchain transaction)
        - `POST /api/campaigns/{id}/allocate_funds/` - Allocate funds to events
        - `GET /api/campaigns/{id}/utilization/` - Get fund utilization stats

        ### Transactions
        - `GET /api/campaigns/all_transactions/` - Get all blockchain transactions

        ## 🔧 Environment Variables
        ```bash
        BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
        CONTRACT_ADDRESS=0x...
        ADMIN_WALLET_ADDRESS=0x...
        ADMIN_WALLET_PRIVATE_KEY=0x...
        ```

        ## 🧪 Testing
        Use the interactive Swagger UI to test all endpoints. Ensure you have:
        - Valid authentication tokens
        - Proper role permissions
        - Blockchain configuration set up

        ## 📞 Support
        For technical support or questions, contact: mithilapanagoda@gmail.com
        """,
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(
            name="Mithila Panagoda",
            email="mithilapanagoda@gmail.com",
            url="https://github.com/mithilapanagoda"
        ),
        license=openapi.License(
            name="MIT License",
            url="https://opensource.org/licenses/MIT"
        ),
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
