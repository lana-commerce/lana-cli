
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
  const m = await import("../extra/inventory-locations.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Inventory Locations.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Inventory Locations.\n\nhttps://docs.lana.dev/commerce/query/inventoryLocations")
  .option("--disabled", "Whether to include disabled inventory locations.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,'customer collection':v=>v.customer_collection?'Yes':'No',created:v=>new Date(v.created_at).toLocaleString(),enabled:v=>v.enabled?'Yes':'No'}", "{id:v=>v.id,name:v=>v.name,customer_collection:v=>v.customer_collection,created_at:v=>v.created_at,enabled:v=>v.enabled}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:inventory_locations.json")
    if (opts.disabled) req = req.disabled(true)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Inventory Locations.\n\nhttps://docs.lana.dev/commerce/query/inventoryLocations")
  .option("--disabled", "Whether to include disabled inventory locations.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,'customer collection':v=>v.customer_collection?'Yes':'No',created:v=>new Date(v.created_at).toLocaleString(),enabled:v=>v.enabled?'Yes':'No'}", "{id:v=>v.id,name:v=>v.name,customer_collection:v=>v.customer_collection,created_at:v=>v.created_at,enabled:v=>v.enabled}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:inventory_locations.json")
    req = req.ids(ids)
    if (opts.disabled) req = req.disabled(true)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })


  .command("create", "Create one or multiple Inventory Locations.\n\nhttps://docs.lana.dev/commerce/mutation/inventoryLocationsCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--address <json>", "(required) Address of the inventory location (warehouse).", { value: v => JSON.parse(v) })
  .option("--name <string>", "(required) Name of the inventory location.")
  .option("--customer-collection <boolean:boolean>", "Whether customer collection is allowed or not.")
  .option("--enabled <boolean:boolean>", "Whether inventory location is enabled or not.")
  .option("--hours <json>", "", { value: v => JSON.parse(v) })
  .option("--lead-time-hours-max <number:number>", "The maximum amount of time the inventory location will take to fulfill the order.")
  .option("--lead-time-hours-min <number:number>", "The minimum amount of time the inventory location will take to fulfill the order.")
  .option("--special-hours <json>", "", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:inventory_locations.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      address: "address",
      name: "name",
      customerCollection: "customer_collection",
      enabled: "enabled",
      hours: "hours",
      leadTimeHoursMax: "lead_time_hours_max",
      leadTimeHoursMin: "lead_time_hours_min",
      specialHours: "special_hours",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Inventory Locations.\n\nhttps://docs.lana.dev/commerce/mutation/inventoryLocationsModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--address <json>", "Address of the inventory location (warehouse).", { value: v => JSON.parse(v) })
  .option("--customer-collection <boolean:boolean>", "Whether customer collection is allowed or not.")
  .option("--enabled <boolean:boolean>", "Whether inventory location is enabled or not.")
  .option("--hours <json>", "", { value: v => JSON.parse(v) })
  .option("--lead-time-hours-max <number:number>", "The maximum amount of time the inventory location will take to fulfill the order.")
  .option("--lead-time-hours-min <number:number>", "The minimum amount of time the inventory location will take to fulfill the order.")
  .option("--name <string>", "Name of the inventory location.")
  .option("--special-hours <json>", "", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:inventory_locations.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      address: "address",
      customerCollection: "customer_collection",
      enabled: "enabled",
      hours: "hours",
      leadTimeHoursMax: "lead_time_hours_max",
      leadTimeHoursMin: "lead_time_hours_min",
      name: "name",
      specialHours: "special_hours",
    }));
    await req.sendUnwrap();
  })

  .command("export [output]", "Export Inventory Locations.\n\nGet info on available CSV columns using this command: `info-csv-format get --name inventorylocation`\n\nhttps://docs.lana.dev/commerce/mutation/inventoryLocationsExport")
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
    let req = request(ctx, "POST:inventory_locations/export.json");
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
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Exporting Inventory Locations.");
    const fileID = t?.result_file?.id;
    if (!fileID) throw new Error("file id is missing in task result");
    if (output) {
      await downloadFileToFile(ctx, shopID, fileID, output);
    } else {
      console.log(`Export result is saved to file: ${fileID}`);
    }
  })

  .command("import <input>", "Import Inventory Locations.\n\nGet info on available CSV columns using this command: `info-csv-format get --name inventorylocation`\n\nhttps://docs.lana.dev/commerce/mutation/inventoryLocationsImport")
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
    let req = request(ctx, "POST:inventory_locations/import.json");
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
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Importing Inventory Locations.");
    if (t && t.errors.length > 0) {
      console.log("Errors:");
      for (const e of t.errors) {
        console.log(e.message);
      }
    }
  })

  .reset();

export default addExtraCommands(cmd);
