
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData } from "../lib/inputData.ts"

const subscriptionsPageSortBy = new EnumType(["created_at"]);
const searchSubscriptionsSortBy = new EnumType(["created_at"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/subscriptions.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Subscriptions.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Subscriptions.\n\nhttps://docs.lana.dev/commerce/query/subscriptionsPage")
  .type("subscriptionsPageSortBy", subscriptionsPageSortBy)
  .option("--customer-id <string:string>", "Filter output by customer.")
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:subscriptionsPageSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',variant:v=>v.variant_id||'',created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,customer_id:v=>v.customer_id,variant_id:v=>v.variant_id,created_at:v=>v.created_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:subscriptions/page.json")
    if (opts.stream) {
      if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      await streamValues(req, opts.format, opts.sortBy);
    } else {
      if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })

  .command("get [...ids]", "Get one or multiple Subscriptions.\n\nhttps://docs.lana.dev/commerce/query/subscriptions")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',variant:v=>v.variant_id||'',created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,customer_id:v=>v.customer_id,variant_id:v=>v.variant_id,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:subscriptions.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })




  .command("search", "Search Subscriptions.\n\nhttps://docs.lana.dev/commerce/query/searchSubscriptions")
  .type("searchSubscriptionsSortBy", searchSubscriptionsSortBy)
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:searchSubscriptionsSortBy>", "Whether to sort output in some specific way.")
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
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',variant:v=>v.variant_id||'',created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,customer_id:v=>v.customer_id,variant_id:v=>v.variant_id,created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:search/subscriptions.json");
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

  .command("suggest <...query>", "Suggest Subscriptions.\n\nhttps://docs.lana.dev/commerce/query/suggestSubscriptions")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',variant:v=>v.variant_id||'',created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,customer_id:v=>v.customer_id,variant_id:v=>v.variant_id,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...query) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:suggest/subscriptions.json");
    req = req.expand({ items: true });
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data({ query: query.join(" ") });
    const resp = await req.sendUnwrap();
    printValues(resp.items, opts.format);
  })

  .command("cancel", "Cancel Subscription.\n\nhttps://docs.lana.dev/commerce/mutation/subscriptionsCancel")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--subscription-id <string:string>", "Unique subscription identifier.", { required: true })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:subscriptions/cancel.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.subscriptionId !== undefined) req = req.subscription_id(opts.subscriptionId)
    await req.sendUnwrap();
  })

  .command("edit", "Edit Subscription.\n\nhttps://docs.lana.dev/commerce/mutation/subscriptionsEdit")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--subscription-id <string:string>", "Unique subscription identifier.", { required: true })
  .option("--billing-address <enum>", "Which billing address to use.")
  .option("--billing-address-id <string>", "Custom billing address identifier.")
  .option("--custom-billing-address <json>", "Custom billing address for subscription.", { value: v => JSON.parse(v) })
  .option("--custom-shipping-address <json>", "Custom shipping address for subscription.", { value: v => JSON.parse(v) })
  .option("--payment-source <enum>", "Which payment source to use.")
  .option("--payment-source-id <string>", "Custom shipping address identifier.")
  .option("--shipping-address <enum>", "Which shipping address to use.")
  .option("--shipping-address-id <string>", "Custom shipping address identifier.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:subscriptions/edit.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.subscriptionId !== undefined) req = req.subscription_id(opts.subscriptionId)
    req = req.data(assembleInputData(opts, false, {
      billingAddress: "billing_address",
      billingAddressId: "billing_address_id",
      customBillingAddress: "custom_billing_address",
      customShippingAddress: "custom_shipping_address",
      paymentSource: "payment_source",
      paymentSourceId: "payment_source_id",
      shippingAddress: "shipping_address",
      shippingAddressId: "shipping_address_id",
    }));
    await req.sendUnwrap();
  })

  .command("pause", "Pause Subscription.\n\nhttps://docs.lana.dev/commerce/mutation/subscriptionsPause")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--subscription-id <string:string>", "Unique subscription identifier.", { required: true })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:subscriptions/pause.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.subscriptionId !== undefined) req = req.subscription_id(opts.subscriptionId)
    await req.sendUnwrap();
  })

  .command("resume", "Resume Subscription.\n\nhttps://docs.lana.dev/commerce/mutation/subscriptionsResume")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--subscription-id <string:string>", "Unique subscription identifier.", { required: true })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:subscriptions/resume.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.subscriptionId !== undefined) req = req.subscription_id(opts.subscriptionId)
    await req.sendUnwrap();
  })

  .command("skip-next", "Set Subscription to skip next order/shipment.\n\nhttps://docs.lana.dev/commerce/mutation/subscriptionsSkipNext")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--subscription-id <string:string>", "Unique subscription identifier.", { required: true })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:subscriptions/skip_next.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.subscriptionId !== undefined) req = req.subscription_id(opts.subscriptionId)
    await req.sendUnwrap();
  })

  .reset();

export default addExtraCommands(cmd);
