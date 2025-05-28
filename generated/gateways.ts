
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"

const gatewayType = new EnumType(["manual", "paypal", "stripe", "test"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/gateways.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Gateways.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Gateways.\n\nhttps://docs.lana.dev/commerce/query/gateways")
  .type("gatewayType", gatewayType)
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--type <enum:gatewayType>", "Filter results by gateway type.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,type:v=>v.type,created:v=>new Date(v.created_at).toLocaleString(),enabled:v=>v.enabled?'Yes':'No'}", "{id:v=>v.id,type:v=>v.type,created_at:v=>v.created_at,enabled:v=>v.enabled}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:gateways.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.type !== undefined) req = req.type(opts.type)
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Gateways.\n\nhttps://docs.lana.dev/commerce/query/gateways")
  .type("gatewayType", gatewayType)
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--type <enum:gatewayType>", "Filter results by gateway type.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,type:v=>v.type,created:v=>new Date(v.created_at).toLocaleString(),enabled:v=>v.enabled?'Yes':'No'}", "{id:v=>v.id,type:v=>v.type,created_at:v=>v.created_at,enabled:v=>v.enabled}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:gateways.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.type !== undefined) req = req.type(opts.type)
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Gateways.\n\nhttps://docs.lana.dev/commerce/mutation/gatewaysDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:gateways.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Gateways.\n\nhttps://docs.lana.dev/commerce/mutation/gatewaysCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--type <enum>", "(required) Gateway type.")
  .option("--currencies <json>", "A list of currencies enabled for this gateway.", { value: v => JSON.parse(v) })
  .option("--enabled <boolean:boolean>", "Whether this gateway is enabled or not.")
  .option("--manual <json>", "", { value: v => JSON.parse(v) })
  .option("--paypal <json>", "", { value: v => JSON.parse(v) })
  .option("--stripe <json>", "", { value: v => JSON.parse(v) })
  .option("--test <json>", "", { value: v => JSON.parse(v) })
  .option("--test-mode <boolean:boolean>", "Whether gateway test mode is enabled.")
  .option("--visibility <enum>", "Gateway visibility mode.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:gateways.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      type: "type",
      currencies: "currencies",
      enabled: "enabled",
      manual: "manual",
      paypal: "paypal",
      stripe: "stripe",
      test: "test",
      testMode: "test_mode",
      visibility: "visibility",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Gateways.\n\nhttps://docs.lana.dev/commerce/mutation/gatewaysModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--currencies <json>", "A list of currencies enabled for this gateway.", { value: v => JSON.parse(v) })
  .option("--enabled <boolean:boolean>", "Whether this gateway is enabled or not.")
  .option("--manual <json>", "", { value: v => JSON.parse(v) })
  .option("--paypal <json>", "", { value: v => JSON.parse(v) })
  .option("--stripe <json>", "", { value: v => JSON.parse(v) })
  .option("--test <json>", "", { value: v => JSON.parse(v) })
  .option("--test-mode <boolean:boolean>", "Whether gateway test mode is enabled.")
  .option("--visibility <enum>", "Gateway visibility mode.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:gateways.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      currencies: "currencies",
      enabled: "enabled",
      manual: "manual",
      paypal: "paypal",
      stripe: "stripe",
      test: "test",
      testMode: "test_mode",
      visibility: "visibility",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
