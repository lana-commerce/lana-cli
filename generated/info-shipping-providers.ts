
import { Command } from "@cliffy/command"
import { getRequestContext } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/info-shipping-providers.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Info Shipping Providers.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Info Shipping Providers.\n\nhttps://docs.lana.dev/commerce/query/infoShippingProviders")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{type:v=>v.type,name:v=>v.name}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:info/shipping_providers.json")
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })






  .reset();

export default addExtraCommands(cmd);
