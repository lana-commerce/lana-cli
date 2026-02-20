
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/transfer-notes.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Transfer Notes.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Transfer Notes.\n\nhttps://docs.lana.dev/commerce/query/transferNotes")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--transfer-id <string:string>", "Unique transfer identifier.", { required: true })
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,user:v=>v.user_id||'',created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,user_id:v=>v.user_id,created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:transfer_notes.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.transferId !== undefined) req = req.transfer_id(opts.transferId)
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Transfer Notes.\n\nhttps://docs.lana.dev/commerce/query/transferNotes")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--transfer-id <string:string>", "Unique transfer identifier.", { required: true })
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,user:v=>v.user_id||'',created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,user_id:v=>v.user_id,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:transfer_notes.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.transferId !== undefined) req = req.transfer_id(opts.transferId)
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Transfer Notes.\n\nhttps://docs.lana.dev/commerce/mutation/transferNotesDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--transfer-id <string:string>", "Unique transfer identifier.", { required: true })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:transfer_notes.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.transferId !== undefined) req = req.transfer_id(opts.transferId)
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Transfer Notes.\n\nhttps://docs.lana.dev/commerce/mutation/transferNotesCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--transfer-id <string:string>", "Unique transfer identifier.", { required: true })
  .option("--raw-content <string>", "(required) Raw content of the note.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:transfer_notes.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.transferId !== undefined) req = req.transfer_id(opts.transferId)
    req = req.data(assembleInputData(opts, true, {
      rawContent: "raw_content",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Transfer Notes.\n\nhttps://docs.lana.dev/commerce/mutation/transferNotesModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--transfer-id <string:string>", "Unique transfer identifier.", { required: true })
  .option("--raw-content <string>", "Raw content of the note.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:transfer_notes.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.transferId !== undefined) req = req.transfer_id(opts.transferId)
    req = req.data(assembleInputData(opts, true, {
      rawContent: "raw_content",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
