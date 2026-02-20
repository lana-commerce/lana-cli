
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/payment-methods.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Payment Methods.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Payment Methods.\n\nhttps://docs.lana.dev/commerce/query/organizationsPaymentMethods")
  .option("--organization-id <string:string>", "Unique organization identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:organizations/payment_methods.json")
    req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Payment Methods.\n\nhttps://docs.lana.dev/commerce/query/organizationsPaymentMethods")
  .option("--organization-id <string:string>", "Unique organization identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:organizations/payment_methods.json")
    req = req.ids(ids)
    req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Payment Methods.\n\nhttps://docs.lana.dev/commerce/mutation/organizationsPaymentMethodsDelete")
  .option("--organization-id <string:string>", "Unique organization identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "DELETE:organizations/payment_methods.json")
    req = req.ids(ids)
    req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Payment Methods.\n\nhttps://docs.lana.dev/commerce/mutation/organizationsPaymentMethodsCreate")
  .option("--organization-id <string:string>", "Unique organization identifier.")
  .option("--token <string>", "Stripe payment method token.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "POST:organizations/payment_methods.json");
    req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
    req = req.data(assembleInputData(opts, true, {
      token: "token",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Payment Methods.\n\nhttps://docs.lana.dev/commerce/mutation/organizationsPaymentMethodsModify")
  .option("--organization-id <string:string>", "Unique organization identifier.")
  .option("--address-city <string>", "Billing city.")
  .option("--address-country <string>", "Billing address country code.")
  .option("--address-line1 <string>", "Billing address line 1.")
  .option("--address-line2 <string>", "Billing address line 2.")
  .option("--address-state <string>", "Billing address state code.")
  .option("--address-zip <string>", "Billing zip or postal code.")
  .option("--exp-month <number:number>", "Credit card expiration month.")
  .option("--exp-year <number:number>", "Credit card expiration year.")
  .option("--name <string>", "Name of the card holder.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "POST:organizations/payment_methods.json").ids(ids);
    req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
    req = req.data(assembleInputData(opts, true, {
      addressCity: "address_city",
      addressCountry: "address_country",
      addressLine1: "address_line1",
      addressLine2: "address_line2",
      addressState: "address_state",
      addressZip: "address_zip",
      expMonth: "exp_month",
      expYear: "exp_year",
      name: "name",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
