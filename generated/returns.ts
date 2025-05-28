
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"

const returnCategory = new EnumType(["any", "approved", "archived", "inspected", "received", "refunded", "rejected", "requested"]);
const returnsPageSortBy = new EnumType(["created_at"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/returns.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Returns.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Returns.\n\nhttps://docs.lana.dev/commerce/query/returnsPage")
  .type("returnCategory", returnCategory)
  .type("returnsPageSortBy", returnsPageSortBy)
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:returnsPageSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--type <enum:returnCategory>", "Filter return output by a return type.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,number:v=>v.number,'tracking company':v=>v.tracking_company,'tracking number':v=>v.tracking_number,'tracking url':v=>v.tracking_url,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,number:v=>v.number,tracking_company:v=>v.tracking_company,tracking_number:v=>v.tracking_number,tracking_url:v=>v.tracking_url,created_at:v=>v.created_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:returns/page.json")
    if (opts.stream) {
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.type !== undefined) req = req.type(opts.type)
      await streamValues(req, opts.format, opts.sortBy);
    } else {
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.type !== undefined) req = req.type(opts.type)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })

  .command("get [...ids]", "Get one or multiple Returns.\n\nhttps://docs.lana.dev/commerce/query/returns")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,number:v=>v.number,'tracking company':v=>v.tracking_company,'tracking number':v=>v.tracking_number,'tracking url':v=>v.tracking_url,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,number:v=>v.number,tracking_company:v=>v.tracking_company,tracking_number:v=>v.tracking_number,tracking_url:v=>v.tracking_url,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:returns.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })


  .command("create", "Create one or multiple Returns.\n\nhttps://docs.lana.dev/commerce/mutation/returnsCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--line-items <json>", "(required).", { value: v => JSON.parse(v) })
  .option("--order-id <string>", "(required) A unique order identifier.")
  .option("--return-policy-id <string>", "(required) Unique return policy identifier.")
  .option("--shipping-option-index <number:number>", "(required) Index of the shipping option within return policy.")
  .option("--customer-balance <boolean:boolean>", "Whether to refund to customer balance.")
  .option("--tags <json>", "Return tags (can be used for organization).", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:returns.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      lineItems: "line_items",
      orderId: "order_id",
      returnPolicyId: "return_policy_id",
      shippingOptionIndex: "shipping_option_index",
      customerBalance: "customer_balance",
      tags: "tags",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })


  .command("approve", "Approve Return.\n\nhttps://docs.lana.dev/commerce/mutation/returnsApprove")
  .option("--return-id <string:string>", "Unique return identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--label-file-id <string>", "Label file ID.")
  .option("--shipping-provider-type <enum>", "Type of the shipping provider.")
  .option("--tracking-company <string>", "The name of the shipping company.")
  .option("--tracking-number <string>", "Shipping number, provided by the shipping company.")
  .option("--tracking-url <string>", "The URLs to track the fulfillment.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:returns/approve.json");
    if (opts.returnId !== undefined) req = req.return_id(opts.returnId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, false, {
      labelFileId: "label_file_id",
      shippingProviderType: "shipping_provider_type",
      trackingCompany: "tracking_company",
      trackingNumber: "tracking_number",
      trackingUrl: "tracking_url",
    }));
    await req.sendUnwrap();
  })

  .command("check", "Check Return.\n\nhttps://docs.lana.dev/commerce/mutation/returnsCheck")
  .option("--return-id <string:string>", "Unique return identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--checked <boolean:boolean>", "(required) Whether this inspection is complete or not.")
  .option("--fulfillment-id <string>", "(required) Fulfillment id.")
  .option("--inspection-id <string>", "(required) Unique return inspection identifier.")
  .option("--line-item-id <string>", "(required) Line item id.")
  .option("--variant-id <string>", "(required) A unique product variant identifier.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:returns/check.json");
    if (opts.returnId !== undefined) req = req.return_id(opts.returnId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      checked: "checked",
      fulfillmentId: "fulfillment_id",
      inspectionId: "inspection_id",
      lineItemId: "line_item_id",
      variantId: "variant_id",
    }));
    await req.sendUnwrap();
  })

  .command("inspect", "Inspect Return.\n\nhttps://docs.lana.dev/commerce/mutation/returnsInspect")
  .option("--return-id <string:string>", "Unique return identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:returns/inspect.json");
    if (opts.returnId !== undefined) req = req.return_id(opts.returnId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("receive", "Receive Return Items.\n\nhttps://docs.lana.dev/commerce/mutation/returnsReceive")
  .option("--return-id <string:string>", "Unique return identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--inventory-location-id <string>", "(required) Unique inventory location identifier.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:returns/receive.json");
    if (opts.returnId !== undefined) req = req.return_id(opts.returnId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, false, {
      inventoryLocationId: "inventory_location_id",
    }));
    await req.sendUnwrap();
  })

  .command("reject", "Reject Return Items.\n\nhttps://docs.lana.dev/commerce/mutation/returnsReject")
  .option("--reason <string:string>", "Reject reason.")
  .option("--return-id <string:string>", "Unique return identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:returns/reject.json");
    if (opts.reason !== undefined) req = req.reason(opts.reason)
    if (opts.returnId !== undefined) req = req.return_id(opts.returnId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("refund", "Refund Return.\n\nhttps://docs.lana.dev/commerce/mutation/returnsRefund")
  .option("--return-id <string:string>", "Unique return identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--amount <number:number>", "(required) Refund amount (doesn't include fee and customer balance portion).")
  .option("--customer-balance <number:number>", "(required) How much to refund to customer balance.")
  .option("--fee <number:number>", "(required) Refund fee.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:returns/refund.json");
    if (opts.returnId !== undefined) req = req.return_id(opts.returnId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, false, {
      amount: "amount",
      customerBalance: "customer_balance",
      fee: "fee",
    }));
    await req.sendUnwrap();
  })

  .command("close", "Close (archive) Return.\n\nhttps://docs.lana.dev/commerce/mutation/returnsClose")
  .option("--return-id <string:string>", "Unique return identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:returns/close.json");
    if (opts.returnId !== undefined) req = req.return_id(opts.returnId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("open", "Open (unarchive) Return.\n\nhttps://docs.lana.dev/commerce/mutation/returnsOpen")
  .option("--return-id <string:string>", "Unique return identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:returns/open.json");
    if (opts.returnId !== undefined) req = req.return_id(opts.returnId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .reset();

export default addExtraCommands(cmd);
