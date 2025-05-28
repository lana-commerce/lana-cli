
import { Command } from "@cliffy/command"
import { getRequestContext } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/info-hs-codes.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Info HS Codes.")
  .action(() => {
    cmd.showHelp();
  })

  .command("get", "Get Info HS Codes.\n\nhttps://docs.lana.dev/commerce/query/infoHsCodes")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:info/hs_codes.json")
    const resp = await req.sendUnwrap();
    printValue(resp, opts.format);
  })





  .reset();

export default addExtraCommands(cmd);
