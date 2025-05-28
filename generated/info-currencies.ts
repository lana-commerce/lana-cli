
import { Command } from "@cliffy/command"
import { getRequestContext } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/info-currencies.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Info Currencies.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Info Currencies.\n\nhttps://docs.lana.dev/commerce/query/infoCurrencies")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{code:v=>v.code,name:v=>v.name,'to minor':v=>v.to_minor}", "{code:v=>v.code,name:v=>v.name,to_minor:v=>v.to_minor}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:info/currencies.json")
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })






  .reset();

export default addExtraCommands(cmd);
