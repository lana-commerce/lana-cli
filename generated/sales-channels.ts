
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/sales-channels.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Sales Channels.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Sales Channels.\n\nhttps://docs.lana.dev/commerce/query/salesChannels")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,enabled:v=>v.enabled?'Yes':'No',storefront:v=>v.storefront?'Yes':'No'}", "{id:v=>v.id,name:v=>v.name,enabled:v=>v.enabled,storefront:v=>v.storefront}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:sales_channels.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Sales Channels.\n\nhttps://docs.lana.dev/commerce/query/salesChannels")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,enabled:v=>v.enabled?'Yes':'No',storefront:v=>v.storefront?'Yes':'No'}", "{id:v=>v.id,name:v=>v.name,enabled:v=>v.enabled,storefront:v=>v.storefront}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:sales_channels.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Sales Channels.\n\nhttps://docs.lana.dev/commerce/mutation/salesChannelsDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:sales_channels.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Sales Channels.\n\nhttps://docs.lana.dev/commerce/mutation/salesChannelsCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--name <string>", "(required) The name of the sales channel.")
  .option("--enabled <boolean:boolean>", "Whether this sales channel is enabled or not.")
  .option("--storefront <boolean:boolean>", "Whether this sales channel can be used via storefront API or not.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:sales_channels.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      name: "name",
      enabled: "enabled",
      storefront: "storefront",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Sales Channels.\n\nhttps://docs.lana.dev/commerce/mutation/salesChannelsModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--enabled <boolean:boolean>", "Whether this sales channel is enabled or not.")
  .option("--name <string>", "The name of the sales channel.")
  .option("--storefront <boolean:boolean>", "Whether this sales channel can be used via storefront API or not.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:sales_channels.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      enabled: "enabled",
      name: "name",
      storefront: "storefront",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
