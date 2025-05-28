
import { Command } from "@cliffy/command"
import { getRequestContext } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/info-csv-format.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Info CSV Format.")
  .action(() => {
    cmd.showHelp();
  })

  .command("get", "Get Info CSV Format.\n\nhttps://docs.lana.dev/commerce/query/infoCsvFormat")
  .option("--name <string:string>", "Name of the format to return.", { required: true })
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{name: v=>v.columns.map(v=>v.name),export: v=>v.columns.map(v=>v.used_in_export?\"Yes\":\"No\"),import: v=>v.columns.map(v=>v.used_in_import?\"Yes\":\"No\"),description: v=>v.columns.map(v=>v.description)}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:info/csv_format.json")
    if (opts.name !== undefined) req = req.name(opts.name)
    const resp = await req.sendUnwrap();
    printValue(resp, opts.format);
  })





  .reset();

export default addExtraCommands(cmd);
