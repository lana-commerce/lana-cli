
import { Command } from "@cliffy/command"
import { getRequestContext } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/info-provinces.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Info Provinces.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Info Provinces.\n\nhttps://docs.lana.dev/commerce/query/infoProvinces")
  .option("--country-code <string:string>", "Country code.", { required: true })
  .option("--province-code <string:string>", "Filter output by province code.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,code:v=>v.code,name:v=>v.name}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:info/provinces.json")
    if (opts.countryCode !== undefined) req = req.country_code(opts.countryCode)
    if (opts.provinceCode !== undefined) req = req.province_code(opts.provinceCode)
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })






  .reset();

export default addExtraCommands(cmd);
