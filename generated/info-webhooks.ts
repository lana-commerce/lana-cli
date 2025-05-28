
import { Command } from "@cliffy/command"
import { getRequestContext } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/info-webhooks.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Info Webhooks.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Info Webhooks.\n\nhttps://docs.lana.dev/commerce/query/infoWebhooks")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{event:v=>v.event_type}", "{event_type:v=>v.event_type}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:info/webhooks.json")
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })






  .reset();

export default addExtraCommands(cmd);
