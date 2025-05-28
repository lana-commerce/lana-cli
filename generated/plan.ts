
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/plan.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Plans.")
  .action(() => {
    cmd.showHelp();
  })



  .command("create", "Create one or multiple Plans.\n\nhttps://docs.lana.dev/commerce/mutation/planCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--plan-id <string>", "(required) Unique plan identifier.")
  .option("--payment-method-id <string>", "Unique payment method identifier.")
  .option("--token <string>", "Stripe payment method token.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:plan.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, false, {
      planId: "plan_id",
      paymentMethodId: "payment_method_id",
      token: "token",
    }));
    await req.sendUnwrap();
  })



  .reset();

export default addExtraCommands(cmd);
