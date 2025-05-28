
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"
import { waitForTaskWithProgressBar } from "../lib/task.ts"
import { downloadFileToFile } from "../lib/file.ts"

const orderType = new EnumType(["abandoned", "any", "archived", "canceled", "draft", "open", "paid", "unfulfilled", "unpaid"]);
const ordersPageSortBy = new EnumType(["created_at", "updated_at"]);
const searchOrdersSortBy = new EnumType(["canceled_at", "closed_at", "created_at", "customer", "financial_status", "fulfillment_status", "number", "paid_at", "total_price", "updated_at"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/orders.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Orders.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Orders.\n\nhttps://docs.lana.dev/commerce/query/ordersPage")
  .type("orderType", orderType)
  .type("ordersPageSortBy", ordersPageSortBy)
  .option("--cart", "Include only cart orders or otherwise only full orders.")
  .option("--created-at-max <datetime:string>", "Filter output by creation date, upper boundary.")
  .option("--created-at-min <datetime:string>", "Filter output by creation date, lower boundary.")
  .option("--customer-id <string:string>", "Filter output by customer.")
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--paid-at-max <datetime:string>", "Filter output by payment date, upper boundary.")
  .option("--paid-at-min <datetime:string>", "Filter output by payment date, lower boundary.")
  .option("--sales-channel-id <string:string>", "Filter output by sales channel.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:ordersPageSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--subscription-id <string:string>", "Filter output by subscription.")
  .option("--type <enum:orderType>", "Filter output by order type.")
  .option("--updated-at-max <datetime:string>", "Filter output by last update date, upper boundary.")
  .option("--updated-at-min <datetime:string>", "Filter output by last update date, lower boundary.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,number:v=>v.number,customer:v=>v.customer_id||'',user:v=>v.user_id||'',currency:v=>v.currency,'total price':v=>formatCurrency(v.total_price,v.currency),created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,number:v=>v.number,customer_id:v=>v.customer_id,user_id:v=>v.user_id,currency:v=>v.currency,total_price:v=>formatCurrency(v.total_price,v.currency),created_at:v=>v.created_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:orders/page.json")
    if (opts.stream) {
      if (opts.cart) req = req.cart(true)
      if (opts.createdAtMax !== undefined) req = req.created_at_max(opts.createdAtMax)
      if (opts.createdAtMin !== undefined) req = req.created_at_min(opts.createdAtMin)
      if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.paidAtMax !== undefined) req = req.paid_at_max(opts.paidAtMax)
      if (opts.paidAtMin !== undefined) req = req.paid_at_min(opts.paidAtMin)
      if (opts.salesChannelId !== undefined) req = req.sales_channel_id(opts.salesChannelId)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.subscriptionId !== undefined) req = req.subscription_id(opts.subscriptionId)
      if (opts.type !== undefined) req = req.type(opts.type)
      if (opts.updatedAtMax !== undefined) req = req.updated_at_max(opts.updatedAtMax)
      if (opts.updatedAtMin !== undefined) req = req.updated_at_min(opts.updatedAtMin)
      await streamValues(req, opts.format, opts.sortBy);
    } else {
      if (opts.cart) req = req.cart(true)
      if (opts.createdAtMax !== undefined) req = req.created_at_max(opts.createdAtMax)
      if (opts.createdAtMin !== undefined) req = req.created_at_min(opts.createdAtMin)
      if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      if (opts.paidAtMax !== undefined) req = req.paid_at_max(opts.paidAtMax)
      if (opts.paidAtMin !== undefined) req = req.paid_at_min(opts.paidAtMin)
      if (opts.salesChannelId !== undefined) req = req.sales_channel_id(opts.salesChannelId)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.subscriptionId !== undefined) req = req.subscription_id(opts.subscriptionId)
      if (opts.type !== undefined) req = req.type(opts.type)
      if (opts.updatedAtMax !== undefined) req = req.updated_at_max(opts.updatedAtMax)
      if (opts.updatedAtMin !== undefined) req = req.updated_at_min(opts.updatedAtMin)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })

  .command("get [...ids]", "Get one or multiple Orders.\n\nhttps://docs.lana.dev/commerce/query/orders")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--uuid <string:string>", ".")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,number:v=>v.number,customer:v=>v.customer_id||'',user:v=>v.user_id||'',currency:v=>v.currency,'total price':v=>formatCurrency(v.total_price,v.currency),created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,number:v=>v.number,customer_id:v=>v.customer_id,user_id:v=>v.user_id,currency:v=>v.currency,total_price:v=>formatCurrency(v.total_price,v.currency),created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:orders.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.uuid !== undefined) req = req.uuid(opts.uuid)
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Orders.\n\nhttps://docs.lana.dev/commerce/mutation/ordersDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:orders.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Orders.\n\nhttps://docs.lana.dev/commerce/mutation/ordersCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--updated-at <datetime:string>", ".")
  .option("--uuid <string:string>", ".")
  .option("--billing-address <json>", "Billing address of an order.", { value: v => JSON.parse(v) })
  .option("--billing-address-short-id <string>", "Billing address of an order (short).")
  .option("--clone-from-id <string>", "Valid order id to clone from, if used all other parameters are ignored.")
  .option("--currency <string>", "Currency to calculate the order in.")
  .option("--custom-items <json>", "", { value: v => JSON.parse(v) })
  .option("--customer-email <string>", "Customer email, used in no auth order flows.")
  .option("--customer-id <string>", "Customer id order belongs to, if customer creates an order this parameter is ignored.")
  .option("--discount-code <string>", "A discount code that can be entered by a customer on checkout.")
  .option("--gateway-id <string>", "Gateway used.")
  .option("--line-items <json>", "Order line items.", { value: v => JSON.parse(v) })
  .option("--mobile <string>", "The mobile phone number of the customer (used for notifications).")
  .option("--mobile-notifications <boolean:boolean>", "Whether to notify customer via mobile phone or not.")
  .option("--sales-channel-id <string>", "Sales channel associated with this order.")
  .option("--send-fulfillment-notifications <boolean:boolean>", "Should customer receive fulfillment-related notifications or not.")
  .option("--send-order-notifications <boolean:boolean>", "Should customer receive order-related notifications or not.")
  .option("--shipping-address <json>", "Shipping address of an order.", { value: v => JSON.parse(v) })
  .option("--shipping-address-short-id <string>", "Shipping address of an order (short).")
  .option("--shipping-rate-ids <json>", "", { value: v => JSON.parse(v) })
  .option("--subscription-id <string>", "Subscription associated with this order.")
  .option("--tags <json>", "Order tags (can be used for organization).", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:orders.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.updatedAt !== undefined) req = req.updated_at(opts.updatedAt)
    if (opts.uuid !== undefined) req = req.uuid(opts.uuid)
    req = req.data(assembleInputData(opts, true, {
      billingAddress: "billing_address",
      billingAddressShortId: "billing_address_short_id",
      cloneFromId: "clone_from_id",
      currency: "currency",
      customItems: "custom_items",
      customerEmail: "customer_email",
      customerId: "customer_id",
      discountCode: "discount_code",
      gatewayId: "gateway_id",
      lineItems: "line_items",
      mobile: "mobile",
      mobileNotifications: "mobile_notifications",
      salesChannelId: "sales_channel_id",
      sendFulfillmentNotifications: "send_fulfillment_notifications",
      sendOrderNotifications: "send_order_notifications",
      shippingAddress: "shipping_address",
      shippingAddressShortId: "shipping_address_short_id",
      shippingRateIds: "shipping_rate_ids",
      subscriptionId: "subscription_id",
      tags: "tags",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Orders.\n\nhttps://docs.lana.dev/commerce/mutation/ordersModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--updated-at <datetime:string>", ".")
  .option("--uuid <string:string>", ".")
  .option("--billing-address <json>", "Billing address of an order.", { value: v => JSON.parse(v) })
  .option("--billing-address-short-id <string>", "Billing address of an order (short).")
  .option("--currency <string>", "Currency to calculate the order in.")
  .option("--custom-items <json>", "", { value: v => JSON.parse(v) })
  .option("--customer-email <string>", "Customer email, used in no auth order flows.")
  .option("--customer-id <string>", "Customer id order belongs to, if customer creates an order this parameter is ignored.")
  .option("--discount-code <string>", "A discount code that can be entered by a customer on checkout.")
  .option("--gateway-id <string>", "Gateway used.")
  .option("--line-items <json>", "Order line items.", { value: v => JSON.parse(v) })
  .option("--mobile <string>", "The mobile phone number of the customer (used for notifications).")
  .option("--mobile-notifications <boolean:boolean>", "Whether to notify customer via mobile phone or not.")
  .option("--sales-channel-id <string>", "Sales channel associated with this order.")
  .option("--send-fulfillment-notifications <boolean:boolean>", "Should customer receive fulfillment-related notifications or not.")
  .option("--send-order-notifications <boolean:boolean>", "Should customer receive order-related notifications or not.")
  .option("--shipping-address <json>", "Shipping address of an order.", { value: v => JSON.parse(v) })
  .option("--shipping-address-short-id <string>", "Shipping address of an order (short).")
  .option("--shipping-rate-ids <json>", "", { value: v => JSON.parse(v) })
  .option("--subscription-id <string>", "Subscription associated with this order.")
  .option("--tags <json>", "Order tags (can be used for organization).", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:orders.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.updatedAt !== undefined) req = req.updated_at(opts.updatedAt)
    if (opts.uuid !== undefined) req = req.uuid(opts.uuid)
    req = req.data(assembleInputData(opts, true, {
      billingAddress: "billing_address",
      billingAddressShortId: "billing_address_short_id",
      currency: "currency",
      customItems: "custom_items",
      customerEmail: "customer_email",
      customerId: "customer_id",
      discountCode: "discount_code",
      gatewayId: "gateway_id",
      lineItems: "line_items",
      mobile: "mobile",
      mobileNotifications: "mobile_notifications",
      salesChannelId: "sales_channel_id",
      sendFulfillmentNotifications: "send_fulfillment_notifications",
      sendOrderNotifications: "send_order_notifications",
      shippingAddress: "shipping_address",
      shippingAddressShortId: "shipping_address_short_id",
      shippingRateIds: "shipping_rate_ids",
      subscriptionId: "subscription_id",
      tags: "tags",
    }));
    await req.sendUnwrap();
  })

  .command("calculate", "Calculate Order.\n\nhttps://docs.lana.dev/commerce/mutation/ordersCalculate")
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--uuid <string:string>", ".")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:orders/calculate.json");
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.uuid !== undefined) req = req.uuid(opts.uuid)
    await req.sendUnwrap();
  })

  .command("allocate-number", "Allocate Order number.\n\nhttps://docs.lana.dev/commerce/mutation/ordersAllocateNumber")
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--uuid <string:string>", ".")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:orders/allocate_number.json");
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.uuid !== undefined) req = req.uuid(opts.uuid)
    await req.sendUnwrap();
  })

  .command("reserve", "Reserve Order.\n\nhttps://docs.lana.dev/commerce/mutation/ordersReserve")
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--uuid <string:string>", ".")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:orders/reserve.json");
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.uuid !== undefined) req = req.uuid(opts.uuid)
    await req.sendUnwrap();
  })

  .command("cancel-reservation", "Cancel Order reservation.\n\nhttps://docs.lana.dev/commerce/mutation/ordersCancelReservation")
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--uuid <string:string>", ".")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:orders/cancel_reservation.json");
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.uuid !== undefined) req = req.uuid(opts.uuid)
    await req.sendUnwrap();
  })

  .command("pay", "Pay Order.\n\nhttps://docs.lana.dev/commerce/mutation/ordersPay")
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--uuid <string:string>", ".")
  .option("--confirm <boolean:boolean>", "Confirm pending payment intent.")
  .option("--credit-card <json>", "Use it to perform gateway payment.", { value: v => JSON.parse(v) })
  .option("--manual <json>", "Use it to perform manual payment.", { value: v => JSON.parse(v) })
  .option("--payment-method <string>", "Use it to perform gateway payment (when gateway type is \"stripe\").")
  .option("--paypal <json>", "Use it to perform gateway payment (when gateway type is \"paypal\").", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:orders/pay.json");
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.uuid !== undefined) req = req.uuid(opts.uuid)
    req = req.data(assembleInputData(opts, false, {
      confirm: "confirm",
      creditCard: "credit_card",
      manual: "manual",
      paymentMethod: "payment_method",
      paypal: "paypal",
    }));
    await req.sendUnwrap();
  })

  .command("capture", "Capture Order payment.\n\nhttps://docs.lana.dev/commerce/mutation/ordersCapture")
  .option("--force", "Force capture (marks order as captured without performing a transaction).")
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:orders/capture.json");
    if (opts.force) req = req.force(true)
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("calculate-refund", "Calculate Order refund.\n\nhttps://docs.lana.dev/commerce/mutation/ordersCalculateRefund")
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--customer-balance <number:number>", "Amount of money to refund to customer's balance.")
  .option("--full-refund <boolean:boolean>", "Whether to perform full refund or not.")
  .option("--full-restock <boolean:boolean>", "Whether to perform full restock or not.")
  .option("--line-items <json>", "", { value: v => JSON.parse(v) })
  .option("--notify <boolean:boolean>", "Whether to notify customer about refund via email or not.")
  .option("--reason <enum>", "Reason why order is refunded.")
  .option("--shipping <json>", "", { value: v => JSON.parse(v) })
  .option("--undo-coupon-usage <boolean:boolean>", "Undo coupon and promotion usage, does nothing but decrements \"times used\" property on the coupon and promotion.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:orders/calculate_refund.json");
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, false, {
      customerBalance: "customer_balance",
      fullRefund: "full_refund",
      fullRestock: "full_restock",
      lineItems: "line_items",
      notify: "notify",
      reason: "reason",
      shipping: "shipping",
      undoCouponUsage: "undo_coupon_usage",
    }));
    await req.sendUnwrap();
  })

  .command("cancel", "Cancel Order.\n\nhttps://docs.lana.dev/commerce/mutation/ordersCancel")
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--archive <boolean:boolean>", "Whether to archive order or not.")
  .option("--notify <boolean:boolean>", "Whether to notify customer about order cancellation via email or not.")
  .option("--reason <enum>", "The reason why the order was canceled.")
  .option("--refund <json>", "", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:orders/cancel.json");
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, false, {
      archive: "archive",
      notify: "notify",
      reason: "reason",
      refund: "refund",
    }));
    await req.sendUnwrap();
  })

  .command("refund", "Refund Order.\n\nhttps://docs.lana.dev/commerce/mutation/ordersRefund")
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--customer-balance <number:number>", "Amount of money to refund to customer's balance.")
  .option("--full-refund <boolean:boolean>", "Whether to perform full refund or not.")
  .option("--full-restock <boolean:boolean>", "Whether to perform full restock or not.")
  .option("--line-items <json>", "", { value: v => JSON.parse(v) })
  .option("--notify <boolean:boolean>", "Whether to notify customer about refund via email or not.")
  .option("--reason <enum>", "Reason why order is refunded.")
  .option("--shipping <json>", "", { value: v => JSON.parse(v) })
  .option("--undo-coupon-usage <boolean:boolean>", "Undo coupon and promotion usage, does nothing but decrements \"times used\" property on the coupon and promotion.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:orders/refund.json");
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, false, {
      customerBalance: "customer_balance",
      fullRefund: "full_refund",
      fullRestock: "full_restock",
      lineItems: "line_items",
      notify: "notify",
      reason: "reason",
      shipping: "shipping",
      undoCouponUsage: "undo_coupon_usage",
    }));
    await req.sendUnwrap();
  })

  .command("restock", "Restock Order.\n\nhttps://docs.lana.dev/commerce/mutation/ordersRestock")
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--full-restock <boolean:boolean>", "Whether to perform full restock or not.")
  .option("--line-items <json>", "Line items to restock.", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:orders/restock.json");
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, false, {
      fullRestock: "full_restock",
      lineItems: "line_items",
    }));
    await req.sendUnwrap();
  })

  .command("override", "Override Order fields.\n\nhttps://docs.lana.dev/commerce/mutation/ordersOverride")
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--uuid <string:string>", ".")
  .option("--on-hold-until <datetime>", "The date and time when order is no longer considered on hold.")
  .option("--shipping-address-latitude <number:number>", "Geographic coordinate specifying the north/south location of an address.")
  .option("--shipping-address-longitude <number:number>", "Geographic coordinate specifying the east/west location of an address.")
  .option("--shipping-address-override <json>", "Shipping address override.", { value: v => JSON.parse(v) })
  .option("--tags <json>", "Order tags (can be used for organization).", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:orders/override.json");
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.uuid !== undefined) req = req.uuid(opts.uuid)
    req = req.data(assembleInputData(opts, false, {
      onHoldUntil: "on_hold_until",
      shippingAddressLatitude: "shipping_address_latitude",
      shippingAddressLongitude: "shipping_address_longitude",
      shippingAddressOverride: "shipping_address_override",
      tags: "tags",
    }));
    await req.sendUnwrap();
  })

  .command("open", "Open (unarchive) Order.\n\nhttps://docs.lana.dev/commerce/mutation/ordersOpen")
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:orders/open.json");
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("close", "Close (archive) Order.\n\nhttps://docs.lana.dev/commerce/mutation/ordersClose")
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:orders/close.json");
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("search", "Search Orders.\n\nhttps://docs.lana.dev/commerce/query/searchOrders")
  .type("searchOrdersSortBy", searchOrdersSortBy)
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:searchOrdersSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--op <enum>", "(required) Combining or comparison operator.")
  .option("--boolean <boolean:boolean>", "Value of the option (if boolean).")
  .option("--context <string>", "Override nesting level context (when automatic logic gives undesired results).")
  .option("--name <string>", "Name of the option.")
  .option("--nil <boolean:boolean>", "Value is nil.")
  .option("--now <boolean:boolean>", "Value is now (rfc3339 time value, server's idea of now).")
  .option("--number <number:number>", "Value of the option (if number).")
  .option("--parent-index <number:number>", "Index of the parent option (usually \"and\", \"or\", \"not\"), -1 if no parent.")
  .option("--text <string>", "Value of the option (if text).")
  .option("--zero <boolean:boolean>", "Value is number zero.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,number:v=>v.number,customer:v=>v.customer_id||'',user:v=>v.user_id||'',currency:v=>v.currency,'total price':v=>formatCurrency(v.total_price,v.currency),created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,number:v=>v.number,customer_id:v=>v.customer_id,user_id:v=>v.user_id,currency:v=>v.currency,total_price:v=>formatCurrency(v.total_price,v.currency),created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:search/orders.json");
    req = req.expand({ items: true });
    if (opts.limit !== undefined) req = req.limit(opts.limit)
    if (opts.offset !== undefined) req = req.offset(opts.offset)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
    if (opts.sortDesc) req = req.sort_desc(true)
    req = req.data(assembleInputData(opts, true, {
      op: "op",
      boolean: "boolean",
      context: "context",
      name: "name",
      nil: "nil",
      now: "now",
      number: "number",
      parentIndex: "parent_index",
      text: "text",
      zero: "zero",
    }));
    const resp = await req.sendUnwrap();
    printValues(resp.items, opts.format);
  })

  .command("suggest <...query>", "Suggest Orders.\n\nhttps://docs.lana.dev/commerce/query/suggestOrders")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,number:v=>v.number,customer:v=>v.customer_id||'',user:v=>v.user_id||'',currency:v=>v.currency,'total price':v=>formatCurrency(v.total_price,v.currency),created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,number:v=>v.number,customer_id:v=>v.customer_id,user_id:v=>v.user_id,currency:v=>v.currency,total_price:v=>formatCurrency(v.total_price,v.currency),created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...query) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:suggest/orders.json");
    req = req.expand({ items: true });
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data({ query: query.join(" ") });
    const resp = await req.sendUnwrap();
    printValues(resp.items, opts.format);
  })

  .command("export [output]", "Export Orders.\n\nGet info on available CSV columns using this command: `info-csv-format get --name order`\n\nhttps://docs.lana.dev/commerce/mutation/ordersExport")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--columns <string>", "Comma separated list of columns to include for export.", { value: (v) => v.split(",") })
  .option("--ids <string>", "Comma separated list of ids to include for export.", { value: (v) => v.split(",") })
  .option("--zip", "Compress the resulting file.")
  .option("--date-and-time-format <string:string>", "Format to use for date and time formatting (uses Go library specification).")
  .option("--date-format <string:string>", "Format to use for date formatting (uses Go library specification).")
  .option("--timezone <string:string>", "Timezone to use with date and time formatting.")
  .option("--length-unit <string:string>", "Length unit to use for formatting.")
  .option("--weight-unit <string:string>", "Weight unit to use for formatting.")
  .action(async (opts, output) => {
    const shopID = opts.shopId || getConfigValue("shop_id");
    const ctx = getRequestContext();
    let req = request(ctx, "POST:orders/export.json");
    req = req.shop_id(shopID)
    req = req.data({
      columns: opts.columns,
      ids: opts.ids,
      zip: opts.zip,
      options: {
        date_and_time_format: opts.dateAndTimeFormat || "",
        date_format: opts.dateFormat || "",
        timezone: opts.timezone || "",
        length_unit: (opts.lengthUnit || "mm") as any,
        weight_unit: (opts.weightUnit || "g") as any,
      },
      })
    const resp = await req.sendUnwrap();
    const taskID = resp.task?.id;
    if (!taskID) throw new Error("task id is missing in response");
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Exporting Orders.");
    const fileID = t?.result_file?.id;
    if (!fileID) throw new Error("file id is missing in task result");
    if (output) {
      await downloadFileToFile(ctx, shopID, fileID, output);
    } else {
      console.log(`Export result is saved to file: ${fileID}`);
    }
  })

  .reset();

export default addExtraCommands(cmd);
