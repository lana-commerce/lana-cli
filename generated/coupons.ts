
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"

const couponsPageSortBy = new EnumType(["created_at"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/coupons.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Coupons.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Coupons.\n\nhttps://docs.lana.dev/commerce/query/couponsPage")
  .type("couponsPageSortBy", couponsPageSortBy)
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--promotion-id <string:string>", "Unique promotion identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:couponsPageSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,code:v=>v.code,'times used':v=>v.times_used,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,code:v=>v.code,times_used:v=>v.times_used,created_at:v=>v.created_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:coupons/page.json")
    if (opts.stream) {
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.promotionId !== undefined) req = req.promotion_id(opts.promotionId)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      await streamValues(req, opts.format, opts.sortBy);
    } else {
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      if (opts.promotionId !== undefined) req = req.promotion_id(opts.promotionId)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })

  .command("get [...ids]", "Get one or multiple Coupons.\n\nhttps://docs.lana.dev/commerce/query/coupons")
  .option("--promotion-id <string:string>", "Unique promotion identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,code:v=>v.code,'times used':v=>v.times_used,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,code:v=>v.code,times_used:v=>v.times_used,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:coupons.json")
    req = req.ids(ids)
    if (opts.promotionId !== undefined) req = req.promotion_id(opts.promotionId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Coupons.\n\nhttps://docs.lana.dev/commerce/mutation/couponsDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:coupons.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Coupons.\n\nhttps://docs.lana.dev/commerce/mutation/couponsCreate")
  .option("--promotion-id <string:string>", "Unique promotion identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--code <string>", "(required) A discount code that can be entered by a customer on checkout.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:coupons.json");
    if (opts.promotionId !== undefined) req = req.promotion_id(opts.promotionId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      code: "code",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })


  .command("generate", "Generate Coupons.\n\nhttps://docs.lana.dev/commerce/mutation/couponsGenerate")
  .option("--promotion-id <string:string>", "Unique promotion identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <enum>", "(required) Format of the generated coupon code.")
  .option("--length <number:number>", "(required) Length of a generated coupon code (without prefix/suffix and dashes).")
  .option("--quantity <number:number>", "(required) Amount of coupons to generate.")
  .option("--dash-section-length <number:number>", "Dash every N characters.")
  .option("--prefix <string>", "Coupon code prefix.")
  .option("--suffix <string>", "Coupon code suffix.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:coupons/generate.json");
    if (opts.promotionId !== undefined) req = req.promotion_id(opts.promotionId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, false, {
      format: "format",
      length: "length",
      quantity: "quantity",
      dashSectionLength: "dash_section_length",
      prefix: "prefix",
      suffix: "suffix",
    }));
    await req.sendUnwrap();
  })

  .reset();

export default addExtraCommands(cmd);
