
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/organizations.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Organizations.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Organizations.\n\nhttps://docs.lana.dev/commerce/query/organizationsPage")
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,created:v=>new Date(v.created_at).toLocaleString(),test:v=>v.test?'Yes':'No'}", "{id:v=>v.id,name:v=>v.name,created_at:v=>v.created_at,test:v=>v.test}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:organizations/page.json")
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

  .command("get", "Get Organization.\n\nhttps://docs.lana.dev/commerce/query/organizations")
  .option("--organization-id <string:string>", "Unique organization identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,created:v=>new Date(v.created_at).toLocaleString(),test:v=>v.test?'Yes':'No'}", "{id:v=>v.id,name:v=>v.name,created_at:v=>v.created_at,test:v=>v.test}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:organizations.json")
    req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
    const resp = await req.sendUnwrap();
    printValue(resp[0], opts.format);
  })


  .command("create", "Create one or multiple Organizations.\n\nhttps://docs.lana.dev/commerce/mutation/organizationsCreate")
  .option("--organization-id <string:string>", "Unique organization identifier.")
  .option("--billing-address <json>", "(required) Billing address of the organization.", { value: v => JSON.parse(v) })
  .option("--name <string>", "(required) The name of the organization.")
  .option("--plan-id <string>", "Unique identifier for the subscription plan a shop is on.")
  .option("--test <boolean:boolean>", "Whether organization is in test mode or not.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "POST:organizations.json");
    req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
    req = req.data(assembleInputData(opts, true, {
      billingAddress: "billing_address",
      name: "name",
      planId: "plan_id",
      test: "test",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify", "Modify Organization.\n\nhttps://docs.lana.dev/commerce/mutation/organizationsModify")
  .option("--organization-id <string:string>", "Unique organization identifier.")
  .option("--billing-address <json>", "Billing address of the organization.", { value: v => JSON.parse(v) })
  .option("--custom-invoice-text <string>", "Additional text to add to an organization billing invoice.")
  .option("--default-payment-method-id <string>", "Unique payment method identifier.")
  .option("--name <string>", "The name of the organization.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "POST:organizations.json");
    req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
    req = req.data(assembleInputData(opts, true, {
      billingAddress: "billing_address",
      customInvoiceText: "custom_invoice_text",
      defaultPaymentMethodId: "default_payment_method_id",
      name: "name",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
