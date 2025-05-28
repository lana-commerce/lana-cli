
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/synonym-settings.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Synonym Settings.")
  .action(() => {
    cmd.showHelp();
  })

  .command("get", "Get Synonym Settings.\n\nhttps://docs.lana.dev/commerce/query/shopsSynonymSettings")
  .option("--normalized", "Return text in normalized form.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{kind: v=>v.entries.map(v=>v.kind),keys: v=>v.entries.map(v=>v.keys.join(', ')),values: v=>v.entries.map(v=>v.values.join(', '))}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:shops/synonym_settings.json")
    if (opts.normalized) req = req.normalized(true)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValue(resp, opts.format);
  })



  .command("modify", "Modify Synonym Settings.\n\nhttps://docs.lana.dev/commerce/mutation/shopsSynonymSettingsCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--entries <json>", "", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:shops/synonym_settings.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, false, {
      entries: "entries",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
