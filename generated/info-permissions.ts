
import { Command } from "@cliffy/command"
import { getRequestContext } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/info-permissions.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Info Permissions.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Info Permissions.\n\nhttps://docs.lana.dev/commerce/query/infoPermissions")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{name:v=>v.name,'read/write':v=>v.is_read?'R':'RW'}", "{name:v=>v.name,is_read:v=>v.is_read}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:info/permissions.json")
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })






  .reset();

export default addExtraCommands(cmd);
