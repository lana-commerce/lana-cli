
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/invitations.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Invitations.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Invitations.\n\nhttps://docs.lana.dev/commerce/query/invitations")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,email:v=>v.email,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,name:v=>v.name,email:v=>v.email,created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:invitations.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Invitations.\n\nhttps://docs.lana.dev/commerce/query/invitations")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,email:v=>v.email,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,name:v=>v.name,email:v=>v.email,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:invitations.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Invitations.\n\nhttps://docs.lana.dev/commerce/mutation/invitationsDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:invitations.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Invitations.\n\nhttps://docs.lana.dev/commerce/mutation/invitationsCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--email <string>", "(required) Email of the invited user.")
  .option("--name <string>", "Name of the user (used when sending an email).")
  .option("--permissions <json>", "A set of permission bits to set for a user when he accepts an invite.", { value: v => JSON.parse(v) })
  .option("--role-ids <json>", "A set of roles to set for a user when he accepts an invite.", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:invitations.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      email: "email",
      name: "name",
      permissions: "permissions",
      roleIds: "role_ids",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })


  .command("accept", "Accept Invitation.\n\nhttps://docs.lana.dev/commerce/mutation/invitationsAccept")
  .option("--accept-shop-id <string:string>", "Unique shop identifier.", { required: true })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "POST:invitations/accept.json");
    if (opts.acceptShopId !== undefined) req = req.accept_shop_id(opts.acceptShopId)
    await req.sendUnwrap();
  })

  .reset();

export default addExtraCommands(cmd);
