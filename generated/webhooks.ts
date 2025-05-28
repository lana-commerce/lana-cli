
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/webhooks.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Webhooks.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Webhooks.\n\nhttps://docs.lana.dev/commerce/query/webhooks")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,url:v=>v.url,'crc status':v=>v.crc_status,enabled:v=>v.enabled?'Yes':'No'}", "{id:v=>v.id,url:v=>v.url,crc_status:v=>v.crc_status,enabled:v=>v.enabled}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:webhooks.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Webhooks.\n\nhttps://docs.lana.dev/commerce/query/webhooks")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,url:v=>v.url,'crc status':v=>v.crc_status,enabled:v=>v.enabled?'Yes':'No'}", "{id:v=>v.id,url:v=>v.url,crc_status:v=>v.crc_status,enabled:v=>v.enabled}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:webhooks.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Webhooks.\n\nhttps://docs.lana.dev/commerce/mutation/webhooksDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:webhooks.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Webhooks.\n\nhttps://docs.lana.dev/commerce/mutation/webhooksCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--url <string>", "(required) Webhook endpoint URL.")
  .option("--enabled <boolean:boolean>", "Whether this webhook is enabled or not.")
  .option("--whitelist <json>", "", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:webhooks.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      url: "url",
      enabled: "enabled",
      whitelist: "whitelist",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Webhooks.\n\nhttps://docs.lana.dev/commerce/mutation/webhooksModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--enabled <boolean:boolean>", "Whether this webhook is enabled or not.")
  .option("--url <string>", "Webhook endpoint URL.")
  .option("--whitelist <json>", "Send only these event types, when empty - send all.", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:webhooks.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      enabled: "enabled",
      url: "url",
      whitelist: "whitelist",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
