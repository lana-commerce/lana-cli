
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
  const m = await import("../extra/packaging.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Packaging.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Packaging.\n\nhttps://docs.lana.dev/commerce/query/packaging")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,width:v=>`${v.width}mm`,height:v=>`${v.height}mm`,length:v=>`${v.length}mm`,weight:v=>`${v.grams}g`,name:v=>v.name,enabled:v=>v.enabled?'Yes':'No'}", "{id:v=>v.id,width:v=>v.width,height:v=>v.height,length:v=>v.length,grams:v=>v.grams,name:v=>v.name,enabled:v=>v.enabled}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:packaging.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Packaging.\n\nhttps://docs.lana.dev/commerce/query/packaging")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,width:v=>`${v.width}mm`,height:v=>`${v.height}mm`,length:v=>`${v.length}mm`,weight:v=>`${v.grams}g`,name:v=>v.name,enabled:v=>v.enabled?'Yes':'No'}", "{id:v=>v.id,width:v=>v.width,height:v=>v.height,length:v=>v.length,grams:v=>v.grams,name:v=>v.name,enabled:v=>v.enabled}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:packaging.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Packaging.\n\nhttps://docs.lana.dev/commerce/mutation/packagingDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:packaging.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Packaging.\n\nhttps://docs.lana.dev/commerce/mutation/packagingCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--name <string>", "(required) Name of the packaging.")
  .option("--enabled <boolean:boolean>", "Whether this packaging is enabled or not.")
  .option("--grams <number:number>", "The weight of the empty packaging in grams.")
  .option("--height <number:number>", "Height of the packaging in millimeters.")
  .option("--inventory-location-ids <json>", "", { value: v => JSON.parse(v) })
  .option("--length <number:number>", "Length of the packaging in millimeters.")
  .option("--max-grams <number:number>", "The maximum weight this packaging can hold (excluding its own weight).")
  .option("--shipping-provider-ids <json>", "", { value: v => JSON.parse(v) })
  .option("--width <number:number>", "Width of the packaging in millimeters.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:packaging.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      name: "name",
      enabled: "enabled",
      grams: "grams",
      height: "height",
      inventoryLocationIds: "inventory_location_ids",
      length: "length",
      maxGrams: "max_grams",
      shippingProviderIds: "shipping_provider_ids",
      width: "width",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Packaging.\n\nhttps://docs.lana.dev/commerce/mutation/packagingModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--enabled <boolean:boolean>", "Whether this packaging is enabled or not.")
  .option("--grams <number:number>", "The weight of the empty packaging in grams.")
  .option("--height <number:number>", "Height of the packaging in millimeters.")
  .option("--inventory-location-ids <json>", "", { value: v => JSON.parse(v) })
  .option("--length <number:number>", "Length of the packaging in millimeters.")
  .option("--max-grams <number:number>", "The maximum weight this packaging can hold (excluding its own weight).")
  .option("--name <string>", "Name of the packaging.")
  .option("--shipping-provider-ids <json>", "", { value: v => JSON.parse(v) })
  .option("--width <number:number>", "Width of the packaging in millimeters.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:packaging.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      enabled: "enabled",
      grams: "grams",
      height: "height",
      inventoryLocationIds: "inventory_location_ids",
      length: "length",
      maxGrams: "max_grams",
      name: "name",
      shippingProviderIds: "shipping_provider_ids",
      width: "width",
    }));
    await req.sendUnwrap();
  })

  .command("export [output]", "Export Packaging.\n\nGet info on available CSV columns using this command: `info-csv-format get --name packaging`\n\nhttps://docs.lana.dev/commerce/mutation/packagingExport")
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
    let req = request(ctx, "POST:packaging/export.json");
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
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Exporting Packaging.");
    const fileID = t?.result_file?.id;
    if (!fileID) throw new Error("file id is missing in task result");
    if (output) {
      await downloadFileToFile(ctx, shopID, fileID, output);
    } else {
      console.log(`Export result is saved to file: ${fileID}`);
    }
  })

  .command("import <input>", "Import Packaging.\n\nGet info on available CSV columns using this command: `info-csv-format get --name packaging`\n\nhttps://docs.lana.dev/commerce/mutation/packagingImport")
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
    let req = request(ctx, "POST:packaging/import.json");
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
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Importing Packaging.");
    if (t && t.errors.length > 0) {
      console.log("Errors:");
      for (const e of t.errors) {
        console.log(e.message);
      }
    }
  })

  .reset();

export default addExtraCommands(cmd);
