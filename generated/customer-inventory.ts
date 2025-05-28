
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"
import { waitForTaskWithProgressBar } from "../lib/task.ts"
import { downloadFileToFile } from "../lib/file.ts"

const customerInventoryItemTypeParam = new EnumType(["any", "disabled", "enabled", "gift_card_not_used", "gift_card_used"]);
const customerInventoryPageSortBy = new EnumType(["created_at"]);
const customerInventoryTypeParam = new EnumType(["digital_good", "gift_card"]);
const searchCustomerInventorySortBy = new EnumType(["created_at"]);
const customerInventoryTypeFilter = new EnumType(["digital_good", "gift_card"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/customer-inventory.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Customer Inventory Items.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Customer Inventory Items.\n\nhttps://docs.lana.dev/commerce/query/customerInventoryPage")
  .type("customerInventoryItemTypeParam", customerInventoryItemTypeParam)
  .type("customerInventoryPageSortBy", customerInventoryPageSortBy)
  .type("customerInventoryTypeParam", customerInventoryTypeParam)
  .option("--customer-id <string:string>", "Unique customer identifier.")
  .option("--item-type <enum:customerInventoryItemTypeParam>", "Filter output by inventory item type.")
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:customerInventoryPageSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--type <enum:customerInventoryTypeParam>", "Filter output by inventory type.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',variant:v=>v.variant_id||'',type:v=>v.type,created:v=>new Date(v.created_at).toLocaleString(),expires:v=>v.expires_at ? new Date(v.expires_at).toLocaleString() : ''}", "{id:v=>v.id,customer_id:v=>v.customer_id,variant_id:v=>v.variant_id,type:v=>v.type,created_at:v=>v.created_at,expires_at:v=>v.expires_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:customer_inventory/page.json")
    if (opts.stream) {
      if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
      if (opts.itemType !== undefined) req = req.item_type(opts.itemType)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.type !== undefined) req = req.type(opts.type)
      await streamValues(req, opts.format, opts.sortBy);
    } else {
      if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
      if (opts.itemType !== undefined) req = req.item_type(opts.itemType)
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

  .command("get [...ids]", "Get one or multiple Customer Inventory Items.\n\nhttps://docs.lana.dev/commerce/query/customerInventory")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',variant:v=>v.variant_id||'',type:v=>v.type,created:v=>new Date(v.created_at).toLocaleString(),expires:v=>v.expires_at ? new Date(v.expires_at).toLocaleString() : ''}", "{id:v=>v.id,customer_id:v=>v.customer_id,variant_id:v=>v.variant_id,type:v=>v.type,created_at:v=>v.created_at,expires_at:v=>v.expires_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:customer_inventory.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })


  .command("create", "Create one or multiple Customer Inventory Items.\n\nhttps://docs.lana.dev/commerce/mutation/customerInventoryCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--customer-id <string>", "(required) Unique customer identifier.")
  .option("--variant-id <string>", "(required) A unique product variant identifier.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:customer_inventory.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      customerId: "customer_id",
      variantId: "variant_id",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Customer Inventory Items.\n\nhttps://docs.lana.dev/commerce/mutation/customerInventoryModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--disabled <boolean:boolean>", "Whehter item is disabled or not.")
  .option("--expires-at <datetime>", "Date and time when item expires.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:customer_inventory.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      disabled: "disabled",
      expiresAt: "expires_at",
    }));
    await req.sendUnwrap();
  })

  .command("search", "Search Customer Inventory Items.\n\nhttps://docs.lana.dev/commerce/query/searchCustomerInventory")
  .type("searchCustomerInventorySortBy", searchCustomerInventorySortBy)
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:searchCustomerInventorySortBy>", "Whether to sort output in some specific way.")
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
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',variant:v=>v.variant_id||'',type:v=>v.type,created:v=>new Date(v.created_at).toLocaleString(),expires:v=>v.expires_at ? new Date(v.expires_at).toLocaleString() : ''}", "{id:v=>v.id,customer_id:v=>v.customer_id,variant_id:v=>v.variant_id,type:v=>v.type,created_at:v=>v.created_at,expires_at:v=>v.expires_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:search/customer_inventory.json");
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

  .command("suggest <...query>", "Suggest Customer Inventory Items.\n\nhttps://docs.lana.dev/commerce/query/suggestCustomerInventory")
  .type("customerInventoryTypeFilter", customerInventoryTypeFilter)
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--type <enum:customerInventoryTypeFilter>", "Filter output by customer inventory item type.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',variant:v=>v.variant_id||'',type:v=>v.type,created:v=>new Date(v.created_at).toLocaleString(),expires:v=>v.expires_at ? new Date(v.expires_at).toLocaleString() : ''}", "{id:v=>v.id,customer_id:v=>v.customer_id,variant_id:v=>v.variant_id,type:v=>v.type,created_at:v=>v.created_at,expires_at:v=>v.expires_at}"),
  })
  .action(async (opts, ...query) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:suggest/customer_inventory.json");
    req = req.expand({ items: true });
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.type !== undefined) req = req.type(opts.type)
    req = req.data({ query: query.join(" ") });
    const resp = await req.sendUnwrap();
    printValues(resp.items, opts.format);
  })

  .command("export [output]", "Export Customer Inventory Items.\n\nGet info on available CSV columns using this command: `info-csv-format get --name customerinventory`\n\nhttps://docs.lana.dev/commerce/mutation/customerInventoryExport")
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
    let req = request(ctx, "POST:customer_inventory/export.json");
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
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Exporting Customer Inventory Items.");
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
