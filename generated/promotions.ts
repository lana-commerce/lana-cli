
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"

const promotionsPageSortBy = new EnumType(["created_at"]);
const promotionsPageStatus = new EnumType(["active", "any", "expired", "inactive"]);
const searchPromotionsSortBy = new EnumType(["created_at", "currency", "ends_at", "starts_at", "times_used"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/promotions.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Promotions.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Promotions.\n\nhttps://docs.lana.dev/commerce/query/promotionsPage")
  .type("promotionsPageSortBy", promotionsPageSortBy)
  .type("promotionsPageStatus", promotionsPageStatus)
  .option("--created-at-max <datetime:string>", "Filter output by creation date, upper boundary.")
  .option("--created-at-min <datetime:string>", "Filter output by creation date, lower boundary.")
  .option("--flat", "Use flat output format instead of a recursive one.")
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:promotionsPageSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--status <enum:promotionsPageStatus>", "Filter promotions output by status.")
  .option("--updated-at-max <datetime:string>", "Filter output by last update date, upper boundary.")
  .option("--updated-at-min <datetime:string>", "Filter output by last update date, lower boundary.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,priority:v=>v.priority,name:v=>v.name,currency:v=>v.currency,'times used':v=>v.times_used,created:v=>new Date(v.created_at).toLocaleString(),enabled:v=>v.enabled?'Yes':'No'}", "{id:v=>v.id,priority:v=>v.priority,name:v=>v.name,currency:v=>v.currency,times_used:v=>v.times_used,created_at:v=>v.created_at,enabled:v=>v.enabled}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:promotions/page.json")
    if (opts.stream) {
      if (opts.createdAtMax !== undefined) req = req.created_at_max(opts.createdAtMax)
      if (opts.createdAtMin !== undefined) req = req.created_at_min(opts.createdAtMin)
      if (opts.flat) req = req.flat(true)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.status !== undefined) req = req.status(opts.status)
      if (opts.updatedAtMax !== undefined) req = req.updated_at_max(opts.updatedAtMax)
      if (opts.updatedAtMin !== undefined) req = req.updated_at_min(opts.updatedAtMin)
      await streamValues(req, opts.format, opts.sortBy);
    } else {
      if (opts.createdAtMax !== undefined) req = req.created_at_max(opts.createdAtMax)
      if (opts.createdAtMin !== undefined) req = req.created_at_min(opts.createdAtMin)
      if (opts.flat) req = req.flat(true)
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.status !== undefined) req = req.status(opts.status)
      if (opts.updatedAtMax !== undefined) req = req.updated_at_max(opts.updatedAtMax)
      if (opts.updatedAtMin !== undefined) req = req.updated_at_min(opts.updatedAtMin)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })

  .command("get [...ids]", "Get one or multiple Promotions.\n\nhttps://docs.lana.dev/commerce/query/promotions")
  .option("--flat", "Use flat output format instead of a recursive one.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,priority:v=>v.priority,name:v=>v.name,currency:v=>v.currency,'times used':v=>v.times_used,created:v=>new Date(v.created_at).toLocaleString(),enabled:v=>v.enabled?'Yes':'No'}", "{id:v=>v.id,priority:v=>v.priority,name:v=>v.name,currency:v=>v.currency,times_used:v=>v.times_used,created_at:v=>v.created_at,enabled:v=>v.enabled}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:promotions.json")
    req = req.ids(ids)
    if (opts.flat) req = req.flat(true)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Promotions.\n\nhttps://docs.lana.dev/commerce/mutation/promotionsDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:promotions.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Promotions.\n\nhttps://docs.lana.dev/commerce/mutation/promotionsCreate")
  .option("--flat", "Use flat output format instead of a recursive one.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--name <string>", "(required) Name of the promotion.")
  .option("--add-quantity <number:number>", "When promotion is applied to order, add this many of add_variant_id to line items.")
  .option("--add-variant-id <string>", "Variant id to add to line items of an order when promotion is used.")
  .option("--auto-apply <boolean:boolean>", "Automatically apply this promotion.")
  .option("--currency <string>", "Currency code used for all order-related prices defined in the promotion.")
  .option("--enabled <boolean:boolean>", "Whether this promotion is active or not.")
  .option("--ends-at <datetime>", "The date and time when the promotion will end.")
  .option("--max-uses-per-coupon <number:number>", "The maximum number of times a promotion may apply to orders.")
  .option("--max-uses-per-customer <number:number>", "The maximum number of uses per-customer.")
  .option("--max-uses-per-order <number:number>", "The maximum number of uses per order.")
  .option("--priority <number:number>", "Priority when automatically applying promotions, higher number takes precedence.")
  .option("--rules <json>", "Possible parameters for this promotion.", { value: v => JSON.parse(v) })
  .option("--starts-at <datetime>", "The date and time when the promotion starts at.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:promotions.json");
    if (opts.flat) req = req.flat(true)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      name: "name",
      addQuantity: "add_quantity",
      addVariantId: "add_variant_id",
      autoApply: "auto_apply",
      currency: "currency",
      enabled: "enabled",
      endsAt: "ends_at",
      maxUsesPerCoupon: "max_uses_per_coupon",
      maxUsesPerCustomer: "max_uses_per_customer",
      maxUsesPerOrder: "max_uses_per_order",
      priority: "priority",
      rules: "rules",
      startsAt: "starts_at",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Promotions.\n\nhttps://docs.lana.dev/commerce/mutation/promotionsModify")
  .option("--flat", "Use flat output format instead of a recursive one.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--add-quantity <number:number>", "When promotion is applied to order, add this many of add_variant_id to line items.")
  .option("--add-variant-id <string>", "Variant id to add to line items of an order when promotion is used.")
  .option("--auto-apply <boolean:boolean>", "Automatically apply this promotion.")
  .option("--currency <string>", "Currency code used for all order-related prices defined in the promotion.")
  .option("--enabled <boolean:boolean>", "Whether this promotion is active or not.")
  .option("--ends-at <datetime>", "The date and time when the promotion will end.")
  .option("--max-uses-per-coupon <number:number>", "The maximum number of times a promotion may apply to orders.")
  .option("--max-uses-per-customer <number:number>", "The maximum number of uses per-customer.")
  .option("--max-uses-per-order <number:number>", "The maximum number of uses per order.")
  .option("--name <string>", "Name of the promotion.")
  .option("--priority <number:number>", "Priority when automatically applying promotions, higher number takes precedence.")
  .option("--rule-names-i18n <json>", "", { value: v => JSON.parse(v) })
  .option("--rules <json>", "Possible parameters for this promotion.", { value: v => JSON.parse(v) })
  .option("--starts-at <datetime>", "The date and time when the promotion starts at.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:promotions.json").ids(ids);
    if (opts.flat) req = req.flat(true)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      addQuantity: "add_quantity",
      addVariantId: "add_variant_id",
      autoApply: "auto_apply",
      currency: "currency",
      enabled: "enabled",
      endsAt: "ends_at",
      maxUsesPerCoupon: "max_uses_per_coupon",
      maxUsesPerCustomer: "max_uses_per_customer",
      maxUsesPerOrder: "max_uses_per_order",
      name: "name",
      priority: "priority",
      ruleNamesI18n: "rule_names_i18n",
      rules: "rules",
      startsAt: "starts_at",
    }));
    await req.sendUnwrap();
  })

  .command("search", "Search Promotions.\n\nhttps://docs.lana.dev/commerce/query/searchPromotions")
  .type("searchPromotionsSortBy", searchPromotionsSortBy)
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:searchPromotionsSortBy>", "Whether to sort output in some specific way.")
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
    value: formatParser("{id:v=>v.id,priority:v=>v.priority,name:v=>v.name,currency:v=>v.currency,'times used':v=>v.times_used,created:v=>new Date(v.created_at).toLocaleString(),enabled:v=>v.enabled?'Yes':'No'}", "{id:v=>v.id,priority:v=>v.priority,name:v=>v.name,currency:v=>v.currency,times_used:v=>v.times_used,created_at:v=>v.created_at,enabled:v=>v.enabled}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:search/promotions.json");
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

  .command("suggest <...query>", "Suggest Promotions.\n\nhttps://docs.lana.dev/commerce/query/suggestPromotions")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,priority:v=>v.priority,name:v=>v.name,currency:v=>v.currency,'times used':v=>v.times_used,created:v=>new Date(v.created_at).toLocaleString(),enabled:v=>v.enabled?'Yes':'No'}", "{id:v=>v.id,priority:v=>v.priority,name:v=>v.name,currency:v=>v.currency,times_used:v=>v.times_used,created_at:v=>v.created_at,enabled:v=>v.enabled}"),
  })
  .action(async (opts, ...query) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:suggest/promotions.json");
    req = req.expand({ items: true });
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data({ query: query.join(" ") });
    const resp = await req.sendUnwrap();
    printValues(resp.items, opts.format);
  })

  .reset();

export default addExtraCommands(cmd);
