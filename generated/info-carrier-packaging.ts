
import { Command } from "@cliffy/command"
import { getRequestContext } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/info-carrier-packaging.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Info Carrier Packaging.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Info Carrier Packaging.\n\nhttps://docs.lana.dev/commerce/query/infoCarrierPackaging")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{type:v=>v.type,width:v=>`${v.width}mm`,height:v=>`${v.height}mm`,length:v=>`${v.length}mm`,weight:v=>`${v.grams}g`,name:v=>v.name}", "{type:v=>v.type,width:v=>v.width,height:v=>v.height,length:v=>v.length,grams:v=>v.grams,name:v=>v.name}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:info/carrier_packaging.json")
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })






  .reset();

export default addExtraCommands(cmd);
