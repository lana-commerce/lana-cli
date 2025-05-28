
import { Command } from "@cliffy/command"
import { getRequestContext } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/info-countries.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Info Countries.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Info Countries.\n\nhttps://docs.lana.dev/commerce/query/infoCountries")
  .option("--country-code <string:string>", "Filter output by country code.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,code:v=>v.code,name:v=>v.name,currency:v=>v.currency,continent:v=>v.continent}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:info/countries.json")
    if (opts.countryCode !== undefined) req = req.country_code(opts.countryCode)
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })






  .reset();

export default addExtraCommands(cmd);
