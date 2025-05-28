
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/shops.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Shops.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Shops.\n\nhttps://docs.lana.dev/commerce/query/shopsPage")
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,test:v=>v.test?'Yes':'No'}", "{id:v=>v.id,name:v=>v.name,test:v=>v.test}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:shops/page.json")
    if (opts.stream) {
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      await streamValues(req, opts.format, "ignore");
    } else {
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })

  .command("get", "Get Shop.\n\nhttps://docs.lana.dev/commerce/query/shops")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,currency:v=>v.currency,created:v=>new Date(v.created_at).toLocaleString(),test:v=>v.test?'Yes':'No'}", "{id:v=>v.id,currency:v=>v.currency,created_at:v=>v.created_at,test:v=>v.test}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:shops.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValue(resp[0], opts.format);
  })


  .command("create", "Create one or multiple Shops.\n\nhttps://docs.lana.dev/commerce/mutation/shopsCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--name <string>", "(required) Name of the shop.")
  .option("--shop-address <json>", "(required) Address of the shop.", { value: v => JSON.parse(v) })
  .option("--app-domain <string>", "Shop's lana.sh sub-domain, must be unique.")
  .option("--currency <string>", "Currency code.")
  .option("--language <string>", "")
  .option("--notification-email <string>", "Email for shop notifications.")
  .option("--plan-id <string>", "Unique identifier for the subscription plan a customer is on.")
  .option("--test <boolean:boolean>", "Whether shop is in test mode or not.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:shops.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      name: "name",
      shopAddress: "shop_address",
      appDomain: "app_domain",
      currency: "currency",
      language: "language",
      notificationEmail: "notification_email",
      planId: "plan_id",
      test: "test",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify", "Modify Shop.\n\nhttps://docs.lana.dev/commerce/mutation/shopsModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--app-domain <string>", "Shop's lana.sh sub-domain, must be unique.")
  .option("--primary-domain-id <string>", "Unique domain identifier.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:shops.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      appDomain: "app_domain",
      primaryDomainId: "primary_domain_id",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
