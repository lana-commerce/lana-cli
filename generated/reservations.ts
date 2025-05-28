
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"

const reservationsPageSortBy = new EnumType(["created_at"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/reservations.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Reservations.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Reservations.\n\nhttps://docs.lana.dev/commerce/query/reservationsPage")
  .type("reservationsPageSortBy", reservationsPageSortBy)
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:reservationsPageSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',comment:v=>v.comment,created:v=>new Date(v.created_at).toLocaleString(),expires:v=>v.expires_at ? new Date(v.expires_at).toLocaleString() : ''}", "{id:v=>v.id,customer_id:v=>v.customer_id,comment:v=>v.comment,created_at:v=>v.created_at,expires_at:v=>v.expires_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:reservations/page.json")
    if (opts.stream) {
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      await streamValues(req, opts.format, opts.sortBy);
    } else {
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })

  .command("get [...ids]", "Get one or multiple Reservations.\n\nhttps://docs.lana.dev/commerce/query/reservations")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',comment:v=>v.comment,created:v=>new Date(v.created_at).toLocaleString(),expires:v=>v.expires_at ? new Date(v.expires_at).toLocaleString() : ''}", "{id:v=>v.id,customer_id:v=>v.customer_id,comment:v=>v.comment,created_at:v=>v.created_at,expires_at:v=>v.expires_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:reservations.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })


  .command("create", "Create one or multiple Reservations.\n\nhttps://docs.lana.dev/commerce/mutation/reservationsCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--comment <string>", "Commentary for reference.")
  .option("--customer-id <string>", "Optional customer associated with a reservation.")
  .option("--expires-at <datetime>", "Date and time when reservation will be automatically nullified.")
  .option("--items <json>", "", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:reservations.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      comment: "comment",
      customerId: "customer_id",
      expiresAt: "expires_at",
      items: "items",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Reservations.\n\nhttps://docs.lana.dev/commerce/mutation/reservationsModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--comment <string>", "Commentary for reference.")
  .option("--customer-id <string>", "Optional customer associated with a reservation.")
  .option("--expires-at <datetime>", "Date and time when reservation will be automatically nullified.")
  .option("--items <json>", "", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:reservations.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      comment: "comment",
      customerId: "customer_id",
      expiresAt: "expires_at",
      items: "items",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
