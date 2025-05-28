
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"
import { waitForTaskWithProgressBar } from "../lib/task.ts"
import { downloadFileToFile, uploadFileToFile } from "../lib/file.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/inventory-rules.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Inventory Rules.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Inventory Rules.\n\nhttps://docs.lana.dev/commerce/query/inventoryRules")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,priority:v=>v.priority,name:v=>v.name,'inventory strategy':v=>v.inventory_strategy,'multiple locations':v=>v.multiple_locations?'Yes':'No','split bundle items':v=>v.split_bundle_items?'Yes':'No','split line items':v=>v.split_line_items?'Yes':'No','prefer pickup location':v=>v.prefer_pickup_location?'Yes':'No'}", "{id:v=>v.id,priority:v=>v.priority,name:v=>v.name,inventory_strategy:v=>v.inventory_strategy,multiple_locations:v=>v.multiple_locations,split_bundle_items:v=>v.split_bundle_items,split_line_items:v=>v.split_line_items,prefer_pickup_location:v=>v.prefer_pickup_location}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:inventory_rules.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Inventory Rules.\n\nhttps://docs.lana.dev/commerce/query/inventoryRules")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,priority:v=>v.priority,name:v=>v.name,'inventory strategy':v=>v.inventory_strategy,'multiple locations':v=>v.multiple_locations?'Yes':'No','split bundle items':v=>v.split_bundle_items?'Yes':'No','split line items':v=>v.split_line_items?'Yes':'No','prefer pickup location':v=>v.prefer_pickup_location?'Yes':'No'}", "{id:v=>v.id,priority:v=>v.priority,name:v=>v.name,inventory_strategy:v=>v.inventory_strategy,multiple_locations:v=>v.multiple_locations,split_bundle_items:v=>v.split_bundle_items,split_line_items:v=>v.split_line_items,prefer_pickup_location:v=>v.prefer_pickup_location}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:inventory_rules.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Inventory Rules.\n\nhttps://docs.lana.dev/commerce/mutation/inventoryRulesDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:inventory_rules.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Inventory Rules.\n\nhttps://docs.lana.dev/commerce/mutation/inventoryRulesCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--name <string>", "(required) Name of the inventory rule.")
  .option("--components <string>", "Inventory rule components (custom JSON format).")
  .option("--inventory-strategy <enum>", "How inventory location should be picked.")
  .option("--multiple-locations <boolean:boolean>", "Whether to allow picking multiple locations per order.")
  .option("--prefer-pickup-location <boolean:boolean>", "Whether to consider customer selected pickup location before anything else.")
  .option("--priority <number:number>", "Priority of the rule (rule with higher priority is to be evaluated first).")
  .option("--split-bundle-items <boolean:boolean>", "Whether to allow splitting bundle line items across multiple locations.")
  .option("--split-line-items <boolean:boolean>", "Whether to allow splitting individual line items across multiple locations.")
  .option("--zones <json>", "", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:inventory_rules.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      name: "name",
      components: "components",
      inventoryStrategy: "inventory_strategy",
      multipleLocations: "multiple_locations",
      preferPickupLocation: "prefer_pickup_location",
      priority: "priority",
      splitBundleItems: "split_bundle_items",
      splitLineItems: "split_line_items",
      zones: "zones",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Inventory Rules.\n\nhttps://docs.lana.dev/commerce/mutation/inventoryRulesModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--components <string>", "Inventory rule components (custom JSON format).")
  .option("--inventory-strategy <enum>", "How inventory location should be picked.")
  .option("--multiple-locations <boolean:boolean>", "Whether to allow picking multiple locations per order.")
  .option("--name <string>", "Name of the inventory rule.")
  .option("--prefer-pickup-location <boolean:boolean>", "Whether to consider customer selected pickup location before anything else.")
  .option("--priority <number:number>", "Priority of the rule (rule with higher priority is to be evaluated first).")
  .option("--split-bundle-items <boolean:boolean>", "Whether to allow splitting bundle line items across multiple locations.")
  .option("--split-line-items <boolean:boolean>", "Whether to allow splitting individual line items across multiple locations.")
  .option("--zones <json>", "", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:inventory_rules.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      components: "components",
      inventoryStrategy: "inventory_strategy",
      multipleLocations: "multiple_locations",
      name: "name",
      preferPickupLocation: "prefer_pickup_location",
      priority: "priority",
      splitBundleItems: "split_bundle_items",
      splitLineItems: "split_line_items",
      zones: "zones",
    }));
    await req.sendUnwrap();
  })

  .command("export [output]", "Export Inventory Rules.\n\nGet info on available CSV columns using this command: `info-csv-format get --name inventoryrule`\n\nhttps://docs.lana.dev/commerce/mutation/inventoryRulesExport")
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
    let req = request(ctx, "POST:inventory_rules/export.json");
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
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Exporting Inventory Rules.");
    const fileID = t?.result_file?.id;
    if (!fileID) throw new Error("file id is missing in task result");
    if (output) {
      await downloadFileToFile(ctx, shopID, fileID, output);
    } else {
      console.log(`Export result is saved to file: ${fileID}`);
    }
  })

  .command("import <input>", "Import Inventory Rules.\n\nGet info on available CSV columns using this command: `info-csv-format get --name inventoryrule`\n\nhttps://docs.lana.dev/commerce/mutation/inventoryRulesImport")
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
    let req = request(ctx, "POST:inventory_rules/import.json");
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
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Importing Inventory Rules.");
    if (t && t.errors.length > 0) {
      console.log("Errors:");
      for (const e of t.errors) {
        console.log(e.message);
      }
    }
  })

  .reset();

export default addExtraCommands(cmd);
