
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/currencies.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Currencies.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Currencies.\n\nhttps://docs.lana.dev/commerce/query/currencies")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{code:v=>v.currency.code,name:v=>v.currency.name,enabled:v=>v.enabled?'Yes':'No'}", "{code:v=>v.currency.code,name:v=>v.currency.name,enabled:v=>v.enabled}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:currencies.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Currencies.\n\nhttps://docs.lana.dev/commerce/query/currencies")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{code:v=>v.currency.code,name:v=>v.currency.name,enabled:v=>v.enabled?'Yes':'No'}", "{code:v=>v.currency.code,name:v=>v.currency.name,enabled:v=>v.enabled}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:currencies.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Currencies.\n\nhttps://docs.lana.dev/commerce/mutation/currenciesDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:currencies.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Currencies.\n\nhttps://docs.lana.dev/commerce/mutation/currenciesCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--currency <string>", "(required) Currency code.")
  .option("--conversion-fee <number:number>", "Additional fee to add when converting to and from this currency (in percents).")
  .option("--custom-exchange-rate <number:number>", "Custom exchange rate to use when converting from primary to this currency.")
  .option("--enabled <boolean:boolean>", "Whether it's allowed to place orders in this currency.")
  .option("--format <json>", "Currency formatting options.", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:currencies.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      currency: "currency",
      conversionFee: "conversion_fee",
      customExchangeRate: "custom_exchange_rate",
      enabled: "enabled",
      format: "format",
    }));
    await req.sendUnwrap();
  })

  .command("modify <ids...>", "Modify one or multiple Currencies.\n\nhttps://docs.lana.dev/commerce/mutation/currenciesModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--conversion-fee <number:number>", "Additional fee to add when converting to and from this currency (in percents).")
  .option("--custom-exchange-rate <number:number>", "Custom exchange rate to use when converting from primary to this currency.")
  .option("--enabled <boolean:boolean>", "Whether it's allowed to place orders in this currency.")
  .option("--format <json>", "Currency formatting options.", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:currencies.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      conversionFee: "conversion_fee",
      customExchangeRate: "custom_exchange_rate",
      enabled: "enabled",
      format: "format",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
