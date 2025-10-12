from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Token, OnChainTransaction, OnChainCampaignEvent


@admin.register(Token)
class TokenAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "token_id",
        "charity_link",
        "value_fiat_lkr",
        "transactions_count",
        "total_volume",
    ]
    list_filter = ["charity", "value_fiat_lkr"]
    search_fields = ["name", "token_id", "description", "charity__name"]
    readonly_fields = ["id", "transactions_count", "total_volume"]
    autocomplete_fields = ["charity"]

    fieldsets = (
        ("Token Information", {"fields": ("token_id", "name", "description")}),
        ("Financial Details", {"fields": ("value_fiat_lkr", "charity")}),
        (
            "Statistics",
            {
                "fields": ("transactions_count", "total_volume"),
                "classes": ("collapse",),
            },
        ),
        ("System", {"fields": ("id",), "classes": ("collapse",)}),
    )

    def charity_link(self, obj):
        url = reverse("admin:charity_charity_change", args=[obj.charity.id])
        return format_html('<a href="{}">{}</a>', url, obj.charity.name)

    charity_link.short_description = "Charity"

    def transactions_count(self, obj):
        count = obj.transactions.count()
        url = reverse("admin:on_chain_onchaintransaction_changelist")
        return format_html(
            '<a href="{}?token__id__exact={}">{} transactions</a>', url, obj.id, count
        )

    transactions_count.short_description = "Transactions"

    def total_volume(self, obj):
        total = sum([tx.amount for tx in obj.transactions.all()])
        return f"{total:,.8f} tokens"

    total_volume.short_description = "Total Volume"


@admin.register(OnChainTransaction)
class OnChainTransactionAdmin(admin.ModelAdmin):
    list_display = [
        "transaction_hash_short",
        "token_link",
        "from_address_short",
        "to_address_short",
        "amount",
        "timestamp",
    ]
    list_filter = ["token", "timestamp"]
    search_fields = [
        "transaction_hash",
        "from_address",
        "to_address",
        "token__name",
        "token__token_id",
    ]
    readonly_fields = ["id", "timestamp"]
    autocomplete_fields = ["token"]
    date_hierarchy = "timestamp"

    fieldsets = (
        ("Transaction Details", {"fields": ("transaction_hash", "token", "amount")}),
        ("Addresses", {"fields": ("from_address", "to_address")}),
        ("Timestamps", {"fields": ("timestamp",)}),
        ("System", {"fields": ("id",), "classes": ("collapse",)}),
    )

    def transaction_hash_short(self, obj):
        return f"{obj.transaction_hash[:10]}...{obj.transaction_hash[-8:]}"

    transaction_hash_short.short_description = "Transaction Hash"

    def token_link(self, obj):
        url = reverse("admin:on_chain_token_change", args=[obj.token.id])
        return format_html('<a href="{}">{}</a>', url, obj.token.name)

    token_link.short_description = "Token"

    def from_address_short(self, obj):
        return f"{obj.from_address[:8]}...{obj.from_address[-6:]}"

    from_address_short.short_description = "From"

    def to_address_short(self, obj):
        return f"{obj.to_address[:8]}...{obj.to_address[-6:]}"

    to_address_short.short_description = "To"

    def get_queryset(self, request):
        # Optimize queries by selecting related token and charity
        return super().get_queryset(request).select_related("token", "token__charity")


@admin.register(OnChainCampaignEvent)
class OnChainCampaignEventAdmin(admin.ModelAdmin):
    list_display = [
        "campaign_event_link",
        "transaction_hash_short",
        "is_on_chain_badge",
        "blockchain_timestamp",
        "created_at",
    ]
    list_filter = [
        "is_on_chain",
        "blockchain_timestamp",
        "created_at",
        "campaign_event__campaign__charity",
    ]
    search_fields = [
        "transaction_hash",
        "campaign_event__title",
        "campaign_event__campaign__title",
        "campaign_event__campaign__charity__name",
    ]
    readonly_fields = ["id", "created_at", "updated_at"]
    autocomplete_fields = ["campaign_event"]
    date_hierarchy = "blockchain_timestamp"

    fieldsets = (
        ("Campaign Event", {"fields": ("campaign_event",)}),
        ("Blockchain Details", {"fields": ("transaction_hash", "blockchain_timestamp", "is_on_chain")}),
        (
            "Timestamps",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def campaign_event_link(self, obj):
        url = reverse("admin:charity_campaignevent_change", args=[obj.campaign_event.id])
        return format_html('<a href="{}">{}</a>', url, obj.campaign_event.title)

    campaign_event_link.short_description = "Campaign Event"

    def transaction_hash_short(self, obj):
        if obj.transaction_hash:
            return f"{obj.transaction_hash[:10]}...{obj.transaction_hash[-8:]}"
        return "-"

    transaction_hash_short.short_description = "Transaction Hash"

    def is_on_chain_badge(self, obj):
        if obj.is_on_chain:
            return format_html('<span style="color: #28a745;">✅ On-Chain</span>')
        else:
            return format_html('<span style="color: #6c757d;">⏳ Pending</span>')

    is_on_chain_badge.short_description = "Status"

    def get_queryset(self, request):
        # Optimize queries by selecting related campaign event and campaign
        return super().get_queryset(request).select_related(
            "campaign_event", "campaign_event__campaign", "campaign_event__campaign__charity"
        )


# Add some inline admin configurations for better UX
class CampaignInline(admin.TabularInline):
    model = None  # This will be imported dynamically to avoid circular imports
    extra = 0
    fields = ["title", "goal_amount", "raised_amount", "start_date", "end_date"]
    readonly_fields = ["raised_amount"]


class TokenInline(admin.TabularInline):
    model = Token
    extra = 0
    fields = ["token_id", "name", "value_fiat_lkr"]


class TransactionInline(admin.TabularInline):
    model = OnChainTransaction
    extra = 0
    fields = ["transaction_hash", "from_address", "to_address", "amount", "timestamp"]
    readonly_fields = ["timestamp"]


# Try to add inlines (will work if charity models are already loaded)
try:
    from apps.charity.models import Campaign

    CampaignInline.model = Campaign
    TokenAdmin.inlines = [TransactionInline]
    # Note: We can't add CampaignInline to CharityAdmin here due to circular imports
    # It should be added in the charity app's admin.py
except ImportError:
    pass
