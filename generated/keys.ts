
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/keys.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Keys.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Keys.\n\nhttps://docs.lana.dev/commerce/query/keys")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,user:v=>v.user_id||'',name:v=>v.name,created:v=>new Date(v.created_at).toLocaleString(),expires:v=>v.expires_at ? new Date(v.expires_at).toLocaleString() : ''}", "{id:v=>v.id,user_id:v=>v.user_id,name:v=>v.name,created_at:v=>v.created_at,expires_at:v=>v.expires_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:keys.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Keys.\n\nhttps://docs.lana.dev/commerce/query/keys")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,user:v=>v.user_id||'',name:v=>v.name,created:v=>new Date(v.created_at).toLocaleString(),expires:v=>v.expires_at ? new Date(v.expires_at).toLocaleString() : ''}", "{id:v=>v.id,user_id:v=>v.user_id,name:v=>v.name,created_at:v=>v.created_at,expires_at:v=>v.expires_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:keys.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Keys.\n\nhttps://docs.lana.dev/commerce/mutation/keysDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:keys.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Keys.\n\nhttps://docs.lana.dev/commerce/mutation/keysCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--expires-at <datetime>", "The date and time when the key expires, RFC3339 format.")
  .option("--name <string>", "The name of the key.")
  .option("--permissions <json>", "A set of permission bits valid for this key.", { value: v => JSON.parse(v) })
  .option("--role-ids <json>", "", { value: v => JSON.parse(v) })
  .option("--sales-channel-id <string>", "Sales channel this API key is associated with.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:keys.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      expiresAt: "expires_at",
      name: "name",
      permissions: "permissions",
      roleIds: "role_ids",
      salesChannelId: "sales_channel_id",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Keys.\n\nhttps://docs.lana.dev/commerce/mutation/keysModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--name <string>", "The name of the key.")
  .option("--permissions <json>", "A set of permission bits valid for this key.", { value: v => JSON.parse(v) })
  .option("--role-ids <json>", "", { value: v => JSON.parse(v) })
  .option("--sales-channel-id <string>", "Sales channel this API key is associated with.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:keys.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      name: "name",
      permissions: "permissions",
      roleIds: "role_ids",
      salesChannelId: "sales_channel_id",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
