
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/shop-settings.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Shop Settings.")
  .action(() => {
    cmd.showHelp();
  })

  .command("get", "Get Shop Settings.\n\nhttps://docs.lana.dev/commerce/query/shopsSettings")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{name:v=>v.name,'notification email':v=>v.notification_email,'customer service email':v=>v.customer_service_email,created:v=>new Date(v.created_at).toLocaleString()}", "{name:v=>v.name,notification_email:v=>v.notification_email,customer_service_email:v=>v.customer_service_email,created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:shops/settings.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValue(resp, opts.format);
  })



  .command("modify", "Modify Shop Settings.\n\nhttps://docs.lana.dev/commerce/mutation/shopsSettingsCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--address-verification <boolean:boolean>", "Whether to verify shipping addresses on paid orders.")
  .option("--address-verification-auto <boolean:boolean>", "Whether to automatically apply shipping address verification result to shipping address.")
  .option("--auto-close <boolean:boolean>", "Automatically close completed orders (fulfilled/paid).")
  .option("--auto-fulfill <boolean:boolean>", "Automatically fulfill digital items of captured orders.")
  .option("--auto-reserve-subscription <boolean:boolean>", "Whether subscriptions should automatically reserve scheduled fulfillments or not.")
  .option("--billing-address <json>", "Billing address of the shop.", { value: v => JSON.parse(v) })
  .option("--consistent-prices <boolean:boolean>", "Whether to keep prices consistent across borders (only relevant for tax inclusive prices).")
  .option("--custom-invoice-text <string>", "Additional text to add to a shop billing invoice.")
  .option("--customer-can-pause-subscription <boolean:boolean>", "Whether customer is allowed to pause subscriptions.")
  .option("--customer-can-skip-subscription <boolean:boolean>", "Whether customer is allowed to skip subscription ticks.")
  .option("--customer-oauth-providers <json>", "OAuth2 providers for customer auth.", { value: v => JSON.parse(v) })
  .option("--customer-service-email <string>", "This address is mentioned in emails sent to customers.")
  .option("--customer-webauthn <boolean:boolean>", "Whether customers can signup/signin using webauthn.")
  .option("--default-payment-method-id <string>", "Unique payment method identifier.")
  .option("--default-tax-rule-id <string>", "Unique tax rule identifier.")
  .option("--gift-card-enabled <boolean:boolean>", "Whether gift cards are enabled or not (not available on Micro).")
  .option("--gift-card-expiration-seconds <number:number>", "If not null, created gift cards will expire after given amount of seconds.")
  .option("--indirect <boolean:boolean>", "Whether shop was created indirectly for a client.")
  .option("--industry <enum>", "Industry this shop belongs to.")
  .option("--invoice-due-date-days <number:number>", "Default invoice due date days to add when sending invoice.")
  .option("--language <string>", "")
  .option("--languages <json>", "Languages shop works with (you can override many text fields with language-specific variants).", { value: v => JSON.parse(v) })
  .option("--name <string>", "Name of the shop.")
  .option("--notification-email <string>", "Email for shop notifications.")
  .option("--notifications <json>", "", { value: v => JSON.parse(v) })
  .option("--on-hold-order-window-minutes <number:number>", "When order is on hold, customer can cancel the order and shop owner cannot fulfill the order.")
  .option("--order-risk-cancel-threshold <number:number>", "Automatically cancel orders with risk score higher than this number (if non-null).")
  .option("--order-risk-warning-threshold <number:number>", "Notify shop owner about orders with risk score higher than this number (if non-null).")
  .option("--prefer-twenty-four-hour <enum>", "Whether to use 24h time format.")
  .option("--previous-service <enum>", "Shop's previous service prior to registeration.")
  .option("--product-review-enabled <boolean:boolean>", "Whether product reviews are enabled or not (not available on Micro).")
  .option("--revenue <enum>", "Revenue of the shop prior to registeration.")
  .option("--round-tax-at <enum>", "At what level the tax should be rounded.")
  .option("--send-abandoned-email-after-seconds <number:number>", "When customer abandons an order, notify him after that period of time.")
  .option("--send-abandoned-email-min-price <number:number>", "Minimum order price to send abandoned order email for.")
  .option("--sender-email <string>", "This address will be used as From for all emails sent to customers and suppliers.")
  .option("--shipping-tax-class <string>", "Tax class used for tax selection when 'shipping_tax_method' is 'custom'.")
  .option("--shipping-tax-method <enum>", "Method that is used to calculate shipping tax.")
  .option("--shop-address <json>", "Address of the shop.", { value: v => JSON.parse(v) })
  .option("--start-number <number:number>", "Starting number for orders.")
  .option("--subscription-retries-schedule <json>", "Custom retry schedule in days if subscription fails, use default if empty.", { value: v => JSON.parse(v) })
  .option("--subscription-retries-schedule-daily <json>", "Custom retry schedule in hours if daily subscription fails, use default if empty.", { value: v => JSON.parse(v) })
  .option("--subtotal-includes-tax <boolean:boolean>", "Whether subtotal includes tax or not (only affects display, not the API's \"subtotal\").")
  .option("--tax-based-on <enum>", "Tax calculation should be based on.")
  .option("--tax-inclusive-prices <boolean:boolean>", "True if prices are tax inclusive, false if exclusive.")
  .option("--tax-label <string>", "How the tax line is displayed. E.g. \"Tax\" or \"Sale Tax\".")
  .option("--timezone <string>", "Name of the time zone the shop is in.")
  .option("--timezone-hint <string>", "Timezone hint. When provided it overrides timezone field, but only if it's correct. If it's incorrect, the value is ignored.")
  .option("--tips-enabled <boolean:boolean>", "Whether tipping orders is enabled or not.")
  .option("--tips-max <number:number>", "Maximum amount for tips in shop's default currency, the default is 1000 in major currency unit (e.g. 1000 USD).")
  .option("--tips-presets <json>", "Tipping presets, must be valid percentages.", { value: v => JSON.parse(v) })
  .option("--tips-variant-id <string>", "Product variant to be used as \"tips\" line item.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:shops/settings.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, false, {
      addressVerification: "address_verification",
      addressVerificationAuto: "address_verification_auto",
      autoClose: "auto_close",
      autoFulfill: "auto_fulfill",
      autoReserveSubscription: "auto_reserve_subscription",
      billingAddress: "billing_address",
      consistentPrices: "consistent_prices",
      customInvoiceText: "custom_invoice_text",
      customerCanPauseSubscription: "customer_can_pause_subscription",
      customerCanSkipSubscription: "customer_can_skip_subscription",
      customerOauthProviders: "customer_oauth_providers",
      customerServiceEmail: "customer_service_email",
      customerWebauthn: "customer_webauthn",
      defaultPaymentMethodId: "default_payment_method_id",
      defaultTaxRuleId: "default_tax_rule_id",
      giftCardEnabled: "gift_card_enabled",
      giftCardExpirationSeconds: "gift_card_expiration_seconds",
      indirect: "indirect",
      industry: "industry",
      invoiceDueDateDays: "invoice_due_date_days",
      language: "language",
      languages: "languages",
      name: "name",
      notificationEmail: "notification_email",
      notifications: "notifications",
      onHoldOrderWindowMinutes: "on_hold_order_window_minutes",
      orderRiskCancelThreshold: "order_risk_cancel_threshold",
      orderRiskWarningThreshold: "order_risk_warning_threshold",
      preferTwentyFourHour: "prefer_twenty_four_hour",
      previousService: "previous_service",
      productReviewEnabled: "product_review_enabled",
      revenue: "revenue",
      roundTaxAt: "round_tax_at",
      sendAbandonedEmailAfterSeconds: "send_abandoned_email_after_seconds",
      sendAbandonedEmailMinPrice: "send_abandoned_email_min_price",
      senderEmail: "sender_email",
      shippingTaxClass: "shipping_tax_class",
      shippingTaxMethod: "shipping_tax_method",
      shopAddress: "shop_address",
      startNumber: "start_number",
      subscriptionRetriesSchedule: "subscription_retries_schedule",
      subscriptionRetriesScheduleDaily: "subscription_retries_schedule_daily",
      subtotalIncludesTax: "subtotal_includes_tax",
      taxBasedOn: "tax_based_on",
      taxInclusivePrices: "tax_inclusive_prices",
      taxLabel: "tax_label",
      timezone: "timezone",
      timezoneHint: "timezone_hint",
      tipsEnabled: "tips_enabled",
      tipsMax: "tips_max",
      tipsPresets: "tips_presets",
      tipsVariantId: "tips_variant_id",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
