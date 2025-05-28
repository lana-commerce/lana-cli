
import { Command } from "@cliffy/command"
import { getRequestContext } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/info-mcc-codes.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Info MCC Codes.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Info MCC Codes.\n\nhttps://docs.lana.dev/commerce/query/infoMccCodes")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{mcc:v=>v.mcc,description:v=>v.edited_description}", "{mcc:v=>v.mcc,edited_description:v=>v.edited_description}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:info/mcc_codes.json")
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })






  .reset();

export default addExtraCommands(cmd);
