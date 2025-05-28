
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/return-inspections.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Return Inspections.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Return Inspections.\n\nhttps://docs.lana.dev/commerce/query/returnInspections")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,enabled:v=>v.enabled?'Yes':'No',description:v=>v.description}", "{id:v=>v.id,enabled:v=>v.enabled,description:v=>v.description}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:return_inspections.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Return Inspections.\n\nhttps://docs.lana.dev/commerce/query/returnInspections")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,enabled:v=>v.enabled?'Yes':'No',description:v=>v.description}", "{id:v=>v.id,enabled:v=>v.enabled,description:v=>v.description}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:return_inspections.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Return Inspections.\n\nhttps://docs.lana.dev/commerce/mutation/returnInspectionsDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:return_inspections.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Return Inspections.\n\nhttps://docs.lana.dev/commerce/mutation/returnInspectionsCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--description <string>", "(required) Return inspection description (custom reasons only).")
  .option("--enabled <boolean:boolean>", "Whether return inspection is enabled or not.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:return_inspections.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      description: "description",
      enabled: "enabled",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Return Inspections.\n\nhttps://docs.lana.dev/commerce/mutation/returnInspectionsModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--description <string>", "Return inspection description (custom reasons only).")
  .option("--enabled <boolean:boolean>", "Whether return inspection is enabled or not.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:return_inspections.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      description: "description",
      enabled: "enabled",
    }));
    await req.sendUnwrap();
  })

  .command("add-default", "Add default Return Inspections.\n\nhttps://docs.lana.dev/commerce/mutation/returnInspectionsAddDefault")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:return_inspections/add_default.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .reset();

export default addExtraCommands(cmd);
