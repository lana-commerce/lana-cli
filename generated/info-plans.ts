
import { Command } from "@cliffy/command"
import { getRequestContext } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/info-plans.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Info Plans.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Info Plans.\n\nhttps://docs.lana.dev/commerce/query/infoPlans")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id: v=>v.plan_id,name: v=>v.plan_name,price: v=>formatCurrency(v.annual?v.price_annual:v.price),annual: v=>v.annual?'Yes':'No'}","{plan_id: v=>v.plan_id,plan_name: v=>v.plan_name,price: v=>formatCurrency(v.annual?v.price_annual:v.price),annual: v=>v.annual}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:info/plans.json")
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })






  .reset();

export default addExtraCommands(cmd);
