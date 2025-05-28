
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/purchase-order-notes.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Purchase Order Notes.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Purchase Order Notes.\n\nhttps://docs.lana.dev/commerce/query/purchaseOrderNotes")
  .option("--purchase-order-id <string:string>", "Unique purchase order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,user:v=>v.user_id||'',text:v=>v.text,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,user_id:v=>v.user_id,text:v=>v.text,created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:purchase_order_notes.json")
    if (opts.purchaseOrderId !== undefined) req = req.purchase_order_id(opts.purchaseOrderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Purchase Order Notes.\n\nhttps://docs.lana.dev/commerce/query/purchaseOrderNotes")
  .option("--purchase-order-id <string:string>", "Unique purchase order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,user:v=>v.user_id||'',text:v=>v.text,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,user_id:v=>v.user_id,text:v=>v.text,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:purchase_order_notes.json")
    req = req.ids(ids)
    if (opts.purchaseOrderId !== undefined) req = req.purchase_order_id(opts.purchaseOrderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Purchase Order Notes.\n\nhttps://docs.lana.dev/commerce/mutation/purchaseOrderNotesDelete")
  .option("--purchase-order-id <string:string>", "Unique purchase order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:purchase_order_notes.json")
    req = req.ids(ids)
    if (opts.purchaseOrderId !== undefined) req = req.purchase_order_id(opts.purchaseOrderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Purchase Order Notes.\n\nhttps://docs.lana.dev/commerce/mutation/purchaseOrderNotesCreate")
  .option("--purchase-order-id <string:string>", "Unique purchase order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--text <string>", "(required) Note text.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:purchase_order_notes.json");
    if (opts.purchaseOrderId !== undefined) req = req.purchase_order_id(opts.purchaseOrderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      text: "text",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Purchase Order Notes.\n\nhttps://docs.lana.dev/commerce/mutation/purchaseOrderNotesModify")
  .option("--purchase-order-id <string:string>", "Unique purchase order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--text <string>", "Note text.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:purchase_order_notes.json").ids(ids);
    if (opts.purchaseOrderId !== undefined) req = req.purchase_order_id(opts.purchaseOrderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      text: "text",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
