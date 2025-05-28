
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"

const approvalStatus = new EnumType(["approved", "disapproved", "pending"]);
const productReviewsAnswersPageSortBy = new EnumType(["created_at"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/product-review-answers.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Product Review Answers.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Product Review Answers.\n\nhttps://docs.lana.dev/commerce/query/productReviewsAnswersPage")
  .type("approvalStatus", approvalStatus)
  .type("productReviewsAnswersPageSortBy", productReviewsAnswersPageSortBy)
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--min-flag-count <number:number>", "Filter by flag count (inclusive).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--product-id <string:string>", "Filter output by product.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:productReviewsAnswersPageSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--status <enum:approvalStatus>", "Publishing approval status.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,user:v=>v.user_id||'',text:v=>v.text,status:v=>v.status,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,user_id:v=>v.user_id,text:v=>v.text,status:v=>v.status,created_at:v=>v.created_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:product_reviews/answers/page.json")
    if (opts.stream) {
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.minFlagCount !== undefined) req = req.min_flag_count(opts.minFlagCount)
      if (opts.productId !== undefined) req = req.product_id(opts.productId)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.status !== undefined) req = req.status(opts.status)
      await streamValues(req, opts.format, opts.sortBy);
    } else {
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.minFlagCount !== undefined) req = req.min_flag_count(opts.minFlagCount)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      if (opts.productId !== undefined) req = req.product_id(opts.productId)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.status !== undefined) req = req.status(opts.status)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })

  .command("get [...ids]", "Get one or multiple Product Review Answers.\n\nhttps://docs.lana.dev/commerce/query/productReviewsAnswers")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,user:v=>v.user_id||'',text:v=>v.text,status:v=>v.status,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,user_id:v=>v.user_id,text:v=>v.text,status:v=>v.status,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:product_reviews/answers.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Product Review Answers.\n\nhttps://docs.lana.dev/commerce/mutation/productReviewsAnswersDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:product_reviews/answers.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Product Review Answers.\n\nhttps://docs.lana.dev/commerce/mutation/productReviewsAnswersCreate")
  .option("--review-id <string:string>", "Subject review identifier.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--text <string>", "(required) Text of the answer.")
  .option("--flag-ignore <boolean:boolean>", "Whether flagging actions are ignored.")
  .option("--status <enum>", "Publishing approval status.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:product_reviews/answers.json");
    if (opts.reviewId !== undefined) req = req.review_id(opts.reviewId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      text: "text",
      flagIgnore: "flag_ignore",
      status: "status",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Product Review Answers.\n\nhttps://docs.lana.dev/commerce/mutation/productReviewsAnswersModify")
  .option("--review-id <string:string>", "Subject review identifier.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--flag-ignore <boolean:boolean>", "Whether flagging actions are ignored.")
  .option("--status <enum>", "Publishing approval status.")
  .option("--text <string>", "Text of the answer.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:product_reviews/answers.json").ids(ids);
    if (opts.reviewId !== undefined) req = req.review_id(opts.reviewId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      flagIgnore: "flag_ignore",
      status: "status",
      text: "text",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
