
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"

const favoriteSortBy = new EnumType(["created_at"]);
const favoriteType = new EnumType(["inventory", "price"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/favorites.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Favorites.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Favorites.\n\nhttps://docs.lana.dev/commerce/query/favoritesPage")
  .type("favoriteSortBy", favoriteSortBy)
  .type("favoriteType", favoriteType)
  .option("--customer-id <string:string>", "Show only favorites of a certain customer.")
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:favoriteSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--type <enum:favoriteType>", "Filter favorites by a type.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',variant:v=>v.variant_id||'','inventory notification':v=>v.inventory_notification?'Yes':'No','price notification':v=>v.price_notification?'Yes':'No',created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,customer_id:v=>v.customer_id,variant_id:v=>v.variant_id,inventory_notification:v=>v.inventory_notification,price_notification:v=>v.price_notification,created_at:v=>v.created_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:favorites/page.json")
    if (opts.stream) {
      if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.type !== undefined) req = req.type(opts.type)
      await streamValues(req, opts.format, opts.sortBy);
    } else {
      if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.type !== undefined) req = req.type(opts.type)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })

  .command("get [...ids]", "Get one or multiple Favorites.\n\nhttps://docs.lana.dev/commerce/query/favorites")
  .option("--customer-id <string:string>", "Unique customer identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',variant:v=>v.variant_id||'','inventory notification':v=>v.inventory_notification?'Yes':'No','price notification':v=>v.price_notification?'Yes':'No',created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,customer_id:v=>v.customer_id,variant_id:v=>v.variant_id,inventory_notification:v=>v.inventory_notification,price_notification:v=>v.price_notification,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:favorites.json")
    req = req.ids(ids)
    if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Favorites.\n\nhttps://docs.lana.dev/commerce/mutation/favoritesDelete")
  .option("--customer-id <string:string>", "Unique customer identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:favorites.json")
    req = req.ids(ids)
    if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Favorites.\n\nhttps://docs.lana.dev/commerce/mutation/favoritesCreate")
  .option("--customer-id <string:string>", "Unique customer identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--variant-id <string>", "(required) Unique variant identifier.")
  .option("--inventory-notification <boolean:boolean>", "Whether inventory notifications are enabled.")
  .option("--price-notification <boolean:boolean>", "Whether price notifications are enabled.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:favorites.json");
    if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      variantId: "variant_id",
      inventoryNotification: "inventory_notification",
      priceNotification: "price_notification",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Favorites.\n\nhttps://docs.lana.dev/commerce/mutation/favoritesModify")
  .option("--customer-id <string:string>", "Unique customer identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--inventory-notification <boolean:boolean>", "Whether inventory notifications are enabled.")
  .option("--price-notification <boolean:boolean>", "Whether price notifications are enabled.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:favorites.json").ids(ids);
    if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      inventoryNotification: "inventory_notification",
      priceNotification: "price_notification",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
