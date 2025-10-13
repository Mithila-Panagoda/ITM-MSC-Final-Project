from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Charity, Campaign, Donation, DonationStatus, CampaignEvent, CampaignEventStatus


@admin.register(Charity)
class CharityAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "contact_email",
        "campaigns_count",
        "total_raised",
        "on_chain_id",
        "created_at",
    ]
    list_filter = ["created_at", "updated_at", "on_chain_id"]
    search_fields = ["name", "description", "contact_email", "on_chain_id"]
    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
        "campaigns_count",
        "total_raised",
        "on_chain_id",
        "transaction_hash",
    ]
    fieldsets = (
        (
            "Basic Information",
            {"fields": ("name", "description", "website", "contact_email")},
        ),
        (
            "Blockchain Details",
            {
                "fields": ("on_chain_id", "transaction_hash"),
                "classes": ("collapse",),
            },
        ),
        (
            "Statistics",
            {"fields": ("campaigns_count", "total_raised"), "classes": ("collapse",)},
        ),
        (
            "Timestamps",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def campaigns_count(self, obj):
        count = obj.campaigns.count()
        url = reverse("admin:charity_campaign_changelist")
        return format_html(
            '<a href="{}?charity__id__exact={}">{} campaigns</a>', url, obj.id, count
        )

    campaigns_count.short_description = "Campaigns"

    def total_raised(self, obj):
        total = sum([campaign.raised_amount for campaign in obj.campaigns.all()])
        return f"${total:,.2f}"

    total_raised.short_description = "Total Raised"

    def on_chain_id_display(self, obj):
        if obj.on_chain_id:
            return f"#{obj.on_chain_id}"
        return "-"

    on_chain_id_display.short_description = "On-Chain ID"


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "charity_link",
        "goal_amount",
        "raised_amount",
        "progress_bar",
        "status",
        "donations_count",
        "on_chain_id",
        "start_date",
        "end_date",
    ]
    list_filter = ["charity", "start_date", "end_date", "created_at", "on_chain_id"]
    search_fields = ["title", "description", "charity__name", "on_chain_id"]
    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
        "progress_percentage",
        "donations_count",
        "status",
        "on_chain_id",
        "transaction_hash",
    ]
    autocomplete_fields = ["charity"]
    date_hierarchy = "start_date"

    fieldsets = (
        ("Campaign Details", {"fields": ("title", "description", "charity")}),
        (
            "Financial Information",
            {"fields": ("goal_amount", "raised_amount", "progress_percentage")},
        ),
        ("Timeline", {"fields": ("start_date", "end_date", "status")}),
        (
            "Blockchain Details",
            {
                "fields": ("on_chain_id", "transaction_hash"),
                "classes": ("collapse",),
            },
        ),
        ("Statistics", {"fields": ("donations_count",), "classes": ("collapse",)}),
        (
            "Timestamps",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def charity_link(self, obj):
        url = reverse("admin:charity_charity_change", args=[obj.charity.id])
        return format_html('<a href="{}">{}</a>', url, obj.charity.name)

    charity_link.short_description = "Charity"

    def progress_percentage(self, obj):
        if obj.goal_amount > 0:
            percentage = (float(obj.raised_amount) / float(obj.goal_amount)) * 100
            return f"{percentage:.1f}%"
        return "0%"

    progress_percentage.short_description = "Progress"

    def progress_bar(self, obj):
        if obj.goal_amount > 0:
            percentage = min(
                (float(obj.raised_amount) / float(obj.goal_amount)) * 100, 100
            )
            color = (
                "#28a745"
                if percentage >= 100
                else "#007bff" if percentage >= 50 else "#ffc107"
            )
            return format_html(
                '<div style="width: 100px; height: 20px; background-color: #e9ecef; border-radius: 4px;">'
                '<div style="width: {}%; height: 100%; background-color: {}; border-radius: 4px;"></div>'
                "</div>",
                percentage,
                color,
            )
        return "-"

    progress_bar.short_description = "Progress"

    def donations_count(self, obj):
        count = obj.donations.filter(status=DonationStatus.COMPLETED).count()
        url = reverse("admin:charity_donation_changelist")
        return format_html(
            '<a href="{}?campaign__id__exact={}">{} donations</a>', url, obj.id, count
        )

    donations_count.short_description = "Donations"

    def status(self, obj):
        from django.utils import timezone

        now = timezone.now()

        if obj.start_date > now:
            return format_html('<span style="color: #6c757d;">📅 Upcoming</span>')
        elif obj.start_date <= now <= obj.end_date:
            return format_html('<span style="color: #28a745;">🟢 Active</span>')
        else:
            return format_html('<span style="color: #dc3545;">🔴 Ended</span>')

    status.short_description = "Status"


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = [
        "user_link",
        "campaign_link",
        "amount",
        "token_link",
        "token_quantity",
        "status_badge",
        "transaction_hash_short",
        "donation_timestamp",
    ]
    list_filter = [
        "status",
        "campaign__charity",
        "token",
        "donation_timestamp",
        "created_at",
    ]
    search_fields = [
        "user__email",
        "user__name",
        "campaign__title",
        "campaign__charity__name",
        "token__name",
        "transaction_hash",
    ]
    readonly_fields = ["id", "created_at", "donation_timestamp", "transaction_hash"]
    autocomplete_fields = ["user", "campaign", "token"]
    date_hierarchy = "donation_timestamp"

    fieldsets = (
        ("Donation Details", {"fields": ("user", "campaign", "status")}),
        ("Amount Information", {"fields": ("amount", "token", "token_quantity")}),
        (
            "Blockchain Details",
            {"fields": ("transaction_hash",), "classes": ("collapse",)},
        ),
        (
            "Timestamps",
            {"fields": ("donation_timestamp", "created_at"), "classes": ("collapse",)},
        ),
        ("System", {"fields": ("id",), "classes": ("collapse",)}),
    )

    def user_link(self, obj):
        url = reverse("admin:users_user_change", args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.name or obj.user.email)

    user_link.short_description = "User"

    def campaign_link(self, obj):
        url = reverse("admin:charity_campaign_change", args=[obj.campaign.id])
        return format_html('<a href="{}">{}</a>', url, obj.campaign.title)

    campaign_link.short_description = "Campaign"

    def token_link(self, obj):
        if obj.token:
            url = reverse("admin:on_chain_token_change", args=[obj.token.id])
            return format_html('<a href="{}">{}</a>', url, obj.token.name)
        return "-"

    token_link.short_description = "Token"

    def status_badge(self, obj):
        colors = {"PENDING": "#ffc107", "COMPLETED": "#28a745", "FAILED": "#dc3545"}
        icons = {"PENDING": "⏳", "COMPLETED": "✅", "FAILED": "❌"}
        color = colors.get(obj.status, "#6c757d")
        icon = icons.get(obj.status, "❓")
        return format_html(
            '<span style="color: {};">{} {}</span>',
            color,
            icon,
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"

    def transaction_hash_short(self, obj):
        if obj.transaction_hash:
            return f"{obj.transaction_hash[:10]}...{obj.transaction_hash[-8:]}"
        return "-"

    transaction_hash_short.short_description = "Transaction Hash"


@admin.register(CampaignEvent)
class CampaignEventAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "campaign_link",
        "amount",
        "status_badge",
        "created_by_link",
        "event_date",
        "created_at",
    ]
    list_filter = [
        "status",
        "campaign__charity",
        "created_by",
        "event_date",
        "created_at",
    ]
    search_fields = [
        "title",
        "description",
        "campaign__title",
        "campaign__charity__name",
        "created_by__name",
        "created_by__email",
    ]
    readonly_fields = ["id", "created_at", "updated_at"]
    autocomplete_fields = ["campaign", "created_by"]
    date_hierarchy = "event_date"
    raw_id_fields = ["campaign", "created_by"]

    fieldsets = (
        ("Event Details", {"fields": ("title", "description", "campaign")}),
        ("Financial Information", {"fields": ("amount",)}),
        ("Event Information", {"fields": ("event_date", "image", "status")}),
        ("Creator", {"fields": ("created_by",)}),
        (
            "Timestamps",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def campaign_link(self, obj):
        url = reverse("admin:charity_campaign_change", args=[obj.campaign.id])
        return format_html('<a href="{}">{}</a>', url, obj.campaign.title)

    campaign_link.short_description = "Campaign"

    def created_by_link(self, obj):
        url = reverse("admin:users_user_change", args=[obj.created_by.id])
        return format_html(
            '<a href="{}">{}</a>', url, obj.created_by.name or obj.created_by.email
        )

    created_by_link.short_description = "Created By"

    def status_badge(self, obj):
        colors = {
            "PENDING": "#ffc107",
            "COMPLETED": "#28a745",
            "CANCELLED": "#dc3545",
        }
        icons = {"PENDING": "⏳", "COMPLETED": "✅", "CANCELLED": "❌"}
        color = colors.get(obj.status, "#6c757d")
        icon = icons.get(obj.status, "❓")
        return format_html(
            '<span style="color: {};">{} {}</span>',
            color,
            icon,
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"


# Inline admin configurations
class CampaignInline(admin.TabularInline):
    model = Campaign
    extra = 0
    fields = ["title", "goal_amount", "raised_amount", "start_date", "end_date"]
    readonly_fields = ["raised_amount"]
    show_change_link = True


class DonationInline(admin.TabularInline):
    model = Donation
    extra = 0
    fields = ["user", "amount", "token_quantity", "status", "donation_timestamp"]
    readonly_fields = ["donation_timestamp"]
    show_change_link = True


class CampaignEventInline(admin.TabularInline):
    model = CampaignEvent
    extra = 0
    fields = ["title", "amount", "status", "event_date", "created_by"]
    readonly_fields = ["created_by"]
    show_change_link = True


# Add inlines to existing admin classes
CharityAdmin.inlines = [CampaignInline]
CampaignAdmin.inlines = [DonationInline, CampaignEventInline]

# Try to add Token inline to Charity (requires on_chain app)
try:
    from apps.on_chain.models import Token

    class TokenInline(admin.TabularInline):
        model = Token
        extra = 0
        fields = ["token_id", "name", "value_fiat_lkr"]
        show_change_link = True

    CharityAdmin.inlines.append(TokenInline)
except ImportError:
    pass


# Customize admin site header
admin.site.site_header = "Charity Platform Administration"
admin.site.site_title = "Charity Admin"
admin.site.index_title = "Welcome to Charity Platform Administration"
