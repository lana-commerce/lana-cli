
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/return-notes.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Return Notes.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Return Notes.\n\nhttps://docs.lana.dev/commerce/query/returnNotes")
  .option("--return-id <string:string>", "Unique return identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,user:v=>v.user_id||'',created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,user_id:v=>v.user_id,created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:return_notes.json")
    if (opts.returnId !== undefined) req = req.return_id(opts.returnId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Return Notes.\n\nhttps://docs.lana.dev/commerce/query/returnNotes")
  .option("--return-id <string:string>", "Unique return identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,user:v=>v.user_id||'',created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,user_id:v=>v.user_id,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:return_notes.json")
    req = req.ids(ids)
    if (opts.returnId !== undefined) req = req.return_id(opts.returnId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Return Notes.\n\nhttps://docs.lana.dev/commerce/mutation/returnNotesDelete")
  .option("--return-id <string:string>", "Unique return identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:return_notes.json")
    req = req.ids(ids)
    if (opts.returnId !== undefined) req = req.return_id(opts.returnId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Return Notes.\n\nhttps://docs.lana.dev/commerce/mutation/returnNotesCreate")
  .option("--return-id <string:string>", "Unique return identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--raw-content <string>", "(required) Raw content of the note.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:return_notes.json");
    if (opts.returnId !== undefined) req = req.return_id(opts.returnId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      rawContent: "raw_content",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Return Notes.\n\nhttps://docs.lana.dev/commerce/mutation/returnNotesModify")
  .option("--return-id <string:string>", "Unique return identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--raw-content <string>", "Raw content of the note.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:return_notes.json").ids(ids);
    if (opts.returnId !== undefined) req = req.return_id(opts.returnId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      rawContent: "raw_content",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
