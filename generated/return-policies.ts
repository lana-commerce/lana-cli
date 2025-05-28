
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/return-policies.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Return Policies.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Return Policies.\n\nhttps://docs.lana.dev/commerce/query/returnPolicies")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,priority:v=>v.priority,name:v=>v.name,currency:v=>v.currency,enabled:v=>v.enabled?'Yes':'No'}", "{id:v=>v.id,priority:v=>v.priority,name:v=>v.name,currency:v=>v.currency,enabled:v=>v.enabled}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:return_policies.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Return Policies.\n\nhttps://docs.lana.dev/commerce/query/returnPolicies")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,priority:v=>v.priority,name:v=>v.name,currency:v=>v.currency,enabled:v=>v.enabled?'Yes':'No'}", "{id:v=>v.id,priority:v=>v.priority,name:v=>v.name,currency:v=>v.currency,enabled:v=>v.enabled}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:return_policies.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Return Policies.\n\nhttps://docs.lana.dev/commerce/mutation/returnPoliciesDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:return_policies.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Return Policies.\n\nhttps://docs.lana.dev/commerce/mutation/returnPoliciesCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--name <string>", "(required) Name of the return policy.")
  .option("--condition <json>", "", { value: v => JSON.parse(v) })
  .option("--currency <string>", "Currency code used for all prices defined in the policy.")
  .option("--enabled <boolean:boolean>", "Whether this return policy is enabled or not.")
  .option("--inspection-ids <json>", "", { value: v => JSON.parse(v) })
  .option("--priority <number:number>", "Priority of the policy (policy with higher priority is to be evaluated first).")
  .option("--refund-option <enum>", "What kind of refund method is allowed.")
  .option("--shipping-options <json>", "", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:return_policies.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      name: "name",
      condition: "condition",
      currency: "currency",
      enabled: "enabled",
      inspectionIds: "inspection_ids",
      priority: "priority",
      refundOption: "refund_option",
      shippingOptions: "shipping_options",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Return Policies.\n\nhttps://docs.lana.dev/commerce/mutation/returnPoliciesModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--condition <json>", "", { value: v => JSON.parse(v) })
  .option("--currency <string>", "Currency code used for all prices defined in the policy.")
  .option("--enabled <boolean:boolean>", "Whether this return policy is enabled or not.")
  .option("--inspection-ids <json>", "", { value: v => JSON.parse(v) })
  .option("--name <string>", "Name of the return policy.")
  .option("--priority <number:number>", "Priority of the policy (policy with higher priority is to be evaluated first).")
  .option("--refund-option <enum>", "What kind of refund method is allowed.")
  .option("--shipping-options <json>", "", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:return_policies.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      condition: "condition",
      currency: "currency",
      enabled: "enabled",
      inspectionIds: "inspection_ids",
      name: "name",
      priority: "priority",
      refundOption: "refund_option",
      shippingOptions: "shipping_options",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
