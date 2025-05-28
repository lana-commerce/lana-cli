
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"
import { waitForTaskWithProgressBar } from "../lib/task.ts"
import { downloadFileToFile, uploadFileToFile } from "../lib/file.ts"

const transferCategory = new EnumType(["any", "closed", "not_received", "partially_received", "past_due", "received"]);
const transfersPageSortBy = new EnumType(["created_at"]);
const searchTransfersSortBy = new EnumType(["created_at", "expected_at", "from_inventory_location", "number", "status", "to_inventory_location", "updated_at"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/transfers.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Transfers.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Transfers.\n\nhttps://docs.lana.dev/commerce/query/transfersPage")
  .type("transferCategory", transferCategory)
  .type("transfersPageSortBy", transfersPageSortBy)
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:transfersPageSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--type <enum:transferCategory>", "Filter transfers output by a transfer type.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,number:v=>v.number,status:v=>v.status,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,number:v=>v.number,status:v=>v.status,created_at:v=>v.created_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:transfers/page.json")
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

  .command("get [...ids]", "Get one or multiple Transfers.\n\nhttps://docs.lana.dev/commerce/query/transfers")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,number:v=>v.number,status:v=>v.status,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,number:v=>v.number,status:v=>v.status,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:transfers.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Transfers.\n\nhttps://docs.lana.dev/commerce/mutation/transfersDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:transfers.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Transfers.\n\nhttps://docs.lana.dev/commerce/mutation/transfersCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--draft <boolean:boolean>", "Whether transfer is in a draft state or not.")
  .option("--expected-at <datetime>", "Date and time when transfer arrival is expected.")
  .option("--from-inventory-location-id <string>", "Unique inventory location id (source).")
  .option("--line-items <json>", "", { value: v => JSON.parse(v) })
  .option("--reference <string>", "Arbitrary reference string.")
  .option("--to-inventory-location-id <string>", "Unique inventory location id (destination).")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:transfers.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      draft: "draft",
      expectedAt: "expected_at",
      fromInventoryLocationId: "from_inventory_location_id",
      lineItems: "line_items",
      reference: "reference",
      toInventoryLocationId: "to_inventory_location_id",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Transfers.\n\nhttps://docs.lana.dev/commerce/mutation/transfersModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--draft <boolean:boolean>", "Whether transfer is in a draft state or not.")
  .option("--expected-at <datetime>", "Date and time when transfer arrival is expected.")
  .option("--from-inventory-location-id <string>", "Unique inventory location id (source).")
  .option("--line-items <json>", "", { value: v => JSON.parse(v) })
  .option("--reference <string>", "Arbitrary reference string.")
  .option("--to-inventory-location-id <string>", "Unique inventory location id (destination).")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:transfers.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      draft: "draft",
      expectedAt: "expected_at",
      fromInventoryLocationId: "from_inventory_location_id",
      lineItems: "line_items",
      reference: "reference",
      toInventoryLocationId: "to_inventory_location_id",
    }));
    await req.sendUnwrap();
  })

  .command("search", "Search Transfers.\n\nhttps://docs.lana.dev/commerce/query/searchTransfers")
  .type("searchTransfersSortBy", searchTransfersSortBy)
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:searchTransfersSortBy>", "Whether to sort output in some specific way.")
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
    value: formatParser("{id:v=>v.id,number:v=>v.number,status:v=>v.status,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,number:v=>v.number,status:v=>v.status,created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:search/transfers.json");
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

  .command("suggest <...query>", "Suggest Transfers.\n\nhttps://docs.lana.dev/commerce/query/suggestTransfers")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,number:v=>v.number,status:v=>v.status,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,number:v=>v.number,status:v=>v.status,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...query) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:suggest/transfers.json");
    req = req.expand({ items: true });
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data({ query: query.join(" ") });
    const resp = await req.sendUnwrap();
    printValues(resp.items, opts.format);
  })

  .command("receive", "Receive Transfer Items.\n\nhttps://docs.lana.dev/commerce/mutation/transfersReceive")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--transfer-id <string:string>", "Unique transfer identifier.", { required: true })
  .option("--line-items <json>", "", { value: v => JSON.parse(v) })
  .option("--receive-all <boolean:boolean>", "Mark all items as received.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:transfers/receive.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.transferId !== undefined) req = req.transfer_id(opts.transferId)
    req = req.data(assembleInputData(opts, false, {
      lineItems: "line_items",
      receiveAll: "receive_all",
    }));
    await req.sendUnwrap();
  })

  .command("reject", "Reject Transfer Items.\n\nhttps://docs.lana.dev/commerce/mutation/transfersReject")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--transfer-id <string:string>", "Unique transfer identifier.", { required: true })
  .option("--line-items <json>", "", { value: v => JSON.parse(v) })
  .option("--reason <string>", "What happened to items?.")
  .option("--reject-all <boolean:boolean>", "Mark all items as rejected.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:transfers/reject.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.transferId !== undefined) req = req.transfer_id(opts.transferId)
    req = req.data(assembleInputData(opts, false, {
      lineItems: "line_items",
      reason: "reason",
      rejectAll: "reject_all",
    }));
    await req.sendUnwrap();
  })

  .command("open", "Open (unarchive) Transfer.\n\nhttps://docs.lana.dev/commerce/mutation/transfersOpen")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--transfer-id <string:string>", "Unique transfer identifier.", { required: true })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:transfers/open.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.transferId !== undefined) req = req.transfer_id(opts.transferId)
    await req.sendUnwrap();
  })

  .command("close", "Close (archive) Transfer.\n\nhttps://docs.lana.dev/commerce/mutation/transfersClose")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--transfer-id <string:string>", "Unique transfer identifier.", { required: true })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:transfers/close.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.transferId !== undefined) req = req.transfer_id(opts.transferId)
    await req.sendUnwrap();
  })

  .command("log", "Get Transfer log.\n\nhttps://docs.lana.dev/commerce/query/transfersLog")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--transfer-id <string:string>", "Unique transfer identifier.", { required: true })
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{user:v=>v.user_id||'',type:v=>v.type,created:v=>new Date(v.created_at).toLocaleString()}", "{user_id:v=>v.user_id,type:v=>v.type,created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:transfers/log.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.transferId !== undefined) req = req.transfer_id(opts.transferId)
    const resp = await req.sendUnwrap();
    printValues(resp.items, opts.format);
  })

  .command("export [output]", "Export Transfers.\n\nGet info on available CSV columns using this command: `info-csv-format get --name transfer`\n\nhttps://docs.lana.dev/commerce/mutation/transfersExport")
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
    let req = request(ctx, "POST:transfers/export.json");
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
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Exporting Transfers.");
    const fileID = t?.result_file?.id;
    if (!fileID) throw new Error("file id is missing in task result");
    if (output) {
      await downloadFileToFile(ctx, shopID, fileID, output);
    } else {
      console.log(`Export result is saved to file: ${fileID}`);
    }
  })

  .command("import <input>", "Import Transfers.\n\nGet info on available CSV columns using this command: `info-csv-format get --name transfer`\n\nhttps://docs.lana.dev/commerce/mutation/transfersImport")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--columns <string>", "Comma separated list of columns to include for import.", { value: (v) => v.split(","), required: true })
  .option("--no-header", "Specify this option when CSV file has no header.")
  .option("--date-and-time-format <string:string>", "Format to use for date and time formatting (uses Go library specification).")
  .option("--date-format <string:string>", "Format to use for date formatting (uses Go library specification).")
  .option("--timezone <string:string>", "Timezone to use with date and time formatting.")
  .action(async (opts, input) => {
    const shopID = opts.shopId || getConfigValue("shop_id");
    const ctx = getRequestContext();
    const fileID = await uploadFileToFile(ctx, shopID, input);
    let req = request(ctx, "POST:transfers/import.json");
    req = req.shop_id(shopID)
    req = req.data({
      file_id: fileID,
      columns: opts.columns,
      skip_header: opts.header,
      options: {
        date_and_time_format: opts.dateAndTimeFormat || "",
        date_format: opts.dateFormat || "",
        timezone: opts.timezone || "",
      },
      })
    const resp = await req.sendUnwrap();
    const taskID = resp.task?.id;
    if (!taskID) throw new Error("task id is missing in response");
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Importing Transfers.");
    if (t && t.errors.length > 0) {
      console.log("Errors:");
      for (const e of t.errors) {
        console.log(e.message);
      }
    }
  })

  .reset();

export default addExtraCommands(cmd);
