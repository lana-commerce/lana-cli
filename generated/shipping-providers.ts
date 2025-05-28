
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/shipping-providers.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Shipping Providers.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Shipping Providers.\n\nhttps://docs.lana.dev/commerce/query/shippingProviders")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,type:v=>v.type,name:v=>v.name,currency:v=>v.currency,created:v=>new Date(v.created_at).toLocaleString(),test:v=>v.test?'Yes':'No'}", "{id:v=>v.id,type:v=>v.type,name:v=>v.name,currency:v=>v.currency,created_at:v=>v.created_at,test:v=>v.test}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:shipping_providers.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Shipping Providers.\n\nhttps://docs.lana.dev/commerce/query/shippingProviders")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,type:v=>v.type,name:v=>v.name,currency:v=>v.currency,created:v=>new Date(v.created_at).toLocaleString(),test:v=>v.test?'Yes':'No'}", "{id:v=>v.id,type:v=>v.type,name:v=>v.name,currency:v=>v.currency,created_at:v=>v.created_at,test:v=>v.test}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:shipping_providers.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Shipping Providers.\n\nhttps://docs.lana.dev/commerce/mutation/shippingProvidersDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:shipping_providers.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Shipping Providers.\n\nhttps://docs.lana.dev/commerce/mutation/shippingProvidersCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--name <string>", "(required) Name of the shipping provider.")
  .option("--type <enum>", "(required) Type of the shipping provider.")
  .option("--auspost-options <json>", "", { value: v => JSON.parse(v) })
  .option("--canadapost-options <json>", "", { value: v => JSON.parse(v) })
  .option("--currency <string>", "Currency code for shipping provider to use.")
  .option("--delivery-date-guaranteed <boolean:boolean>", "Whether delivery date is guaranteed or not (fixed providers).")
  .option("--delivery-days-max <number:number>", "Maximum days it would take to deliver a package (fixed providers).")
  .option("--delivery-days-min <number:number>", "Minimum days it would take to deliver a package (fixed providers).")
  .option("--description <string>", "Description text visible to the customer.")
  .option("--fedex-options <json>", "", { value: v => JSON.parse(v) })
  .option("--lead-time-hours-max <number:number>", "The maximum amount of time the inventory location will take to fulfill the order using this shipping provider.")
  .option("--lead-time-hours-min <number:number>", "The minimum amount of time the inventory location will take to fulfill the order using this shipping provider.")
  .option("--rate <number:number>", "Shipping rate for fixed providers.")
  .option("--surcharge-fixed <number:number>", "For non-fixed shipping provider types, fixed amount to add on top of the rate.")
  .option("--surcharge-percentage <number:number>", "For non-fixed shipping provider types, percentage to add on top of the rate.")
  .option("--test <boolean:boolean>", "Whether shipping provider test mode is enabled.")
  .option("--tracking <boolean:boolean>", "Is it allowed to use this shipping provider for tracking requests?.")
  .option("--ups-options <json>", "", { value: v => JSON.parse(v) })
  .option("--usps-options <json>", "", { value: v => JSON.parse(v) })
  .option("--whitelist <json>", "Shipping rate whilelist for non-fixed providers.", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:shipping_providers.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      name: "name",
      type: "type",
      auspostOptions: "auspost_options",
      canadapostOptions: "canadapost_options",
      currency: "currency",
      deliveryDateGuaranteed: "delivery_date_guaranteed",
      deliveryDaysMax: "delivery_days_max",
      deliveryDaysMin: "delivery_days_min",
      description: "description",
      fedexOptions: "fedex_options",
      leadTimeHoursMax: "lead_time_hours_max",
      leadTimeHoursMin: "lead_time_hours_min",
      rate: "rate",
      surchargeFixed: "surcharge_fixed",
      surchargePercentage: "surcharge_percentage",
      test: "test",
      tracking: "tracking",
      upsOptions: "ups_options",
      uspsOptions: "usps_options",
      whitelist: "whitelist",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Shipping Providers.\n\nhttps://docs.lana.dev/commerce/mutation/shippingProvidersModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--auspost-options <json>", "", { value: v => JSON.parse(v) })
  .option("--canadapost-options <json>", "", { value: v => JSON.parse(v) })
  .option("--currency <string>", "Currency code for shipping provider to use.")
  .option("--delivery-date-guaranteed <boolean:boolean>", "Whether delivery date is guaranteed or not (fixed providers).")
  .option("--delivery-days-max <number:number>", "Maximum days it would take to deliver a package (fixed providers).")
  .option("--delivery-days-min <number:number>", "Minimum days it would take to deliver a package (fixed providers).")
  .option("--description <string>", "Description text visible to the customer.")
  .option("--fedex-options <json>", "", { value: v => JSON.parse(v) })
  .option("--lead-time-hours-max <number:number>", "The maximum amount of time the inventory location will take to fulfill the order using this shipping provider.")
  .option("--lead-time-hours-min <number:number>", "The minimum amount of time the inventory location will take to fulfill the order using this shipping provider.")
  .option("--name <string>", "Name of the shipping provider.")
  .option("--rate <number:number>", "Shipping rate for fixed providers.")
  .option("--surcharge-fixed <number:number>", "For non-fixed shipping provider types, fixed amount to add on top of the rate.")
  .option("--surcharge-percentage <number:number>", "For non-fixed shipping provider types, percentage to add on top of the rate.")
  .option("--test <boolean:boolean>", "Whether shipping provider test mode is enabled.")
  .option("--tracking <boolean:boolean>", "Is it allowed to use this shipping provider for tracking requests?.")
  .option("--type <enum>", "Type of the shipping provider.")
  .option("--ups-options <json>", "", { value: v => JSON.parse(v) })
  .option("--usps-options <json>", "", { value: v => JSON.parse(v) })
  .option("--whitelist <json>", "Shipping rate whilelist for non-fixed providers.", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:shipping_providers.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      auspostOptions: "auspost_options",
      canadapostOptions: "canadapost_options",
      currency: "currency",
      deliveryDateGuaranteed: "delivery_date_guaranteed",
      deliveryDaysMax: "delivery_days_max",
      deliveryDaysMin: "delivery_days_min",
      description: "description",
      fedexOptions: "fedex_options",
      leadTimeHoursMax: "lead_time_hours_max",
      leadTimeHoursMin: "lead_time_hours_min",
      name: "name",
      rate: "rate",
      surchargeFixed: "surcharge_fixed",
      surchargePercentage: "surcharge_percentage",
      test: "test",
      tracking: "tracking",
      type: "type",
      upsOptions: "ups_options",
      uspsOptions: "usps_options",
      whitelist: "whitelist",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
