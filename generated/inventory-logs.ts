
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"

const variantInventoryLogPageSortBy = new EnumType(["created_at"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/inventory-logs.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Inventory Logs.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Inventory Logs.\n\nhttps://docs.lana.dev/commerce/query/variantInventoryLogPage")
  .type("variantInventoryLogPageSortBy", variantInventoryLogPageSortBy)
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:variantInventoryLogPageSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--variant-id <string:string>", "Unique variant identifier.", { required: true })
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{customer:v=>v.customer_id||'',user:v=>v.user_id||'',type:v=>v.type,created:v=>new Date(v.created_at).toLocaleString()}", "{customer_id:v=>v.customer_id,user_id:v=>v.user_id,type:v=>v.type,created_at:v=>v.created_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:variant_inventory/log/page.json")
    if (opts.stream) {
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.variantId !== undefined) req = req.variant_id(opts.variantId)
      await streamValues(req, opts.format, opts.sortBy);
    } else {
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.variantId !== undefined) req = req.variant_id(opts.variantId)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })






  .reset();

export default addExtraCommands(cmd);
