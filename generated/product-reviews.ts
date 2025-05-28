
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"

const approvalStatus = new EnumType(["approved", "disapproved", "pending"]);
const productReviewsPageSortBy = new EnumType(["created_at"]);
const searchReviewsSortBy = new EnumType(["average_score", "created_at", "customer", "product", "rating", "title", "updated_at"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/product-reviews.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Product Reviews.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Product Reviews.\n\nhttps://docs.lana.dev/commerce/query/productReviewsPage")
  .type("approvalStatus", approvalStatus)
  .type("productReviewsPageSortBy", productReviewsPageSortBy)
  .option("--customer-id <string:string>", "Filter output by customer.")
  .option("--language <string:string>", "Filter output by language.")
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--min-flag-count <number:number>", "Filter by flag count (inclusive).")
  .option("--not-customer-id <string:string>", "Filter output by customer (negative).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--product-id <string:string>", "Filter output by product.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:productReviewsPageSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--status <enum:approvalStatus>", "Publishing approval status.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',title:v=>v.title,text:v=>v.text,status:v=>v.status,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,customer_id:v=>v.customer_id,title:v=>v.title,text:v=>v.text,status:v=>v.status,created_at:v=>v.created_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:product_reviews/page.json")
    if (opts.stream) {
      if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
      if (opts.language !== undefined) req = req.language(opts.language)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.minFlagCount !== undefined) req = req.min_flag_count(opts.minFlagCount)
      if (opts.notCustomerId !== undefined) req = req.not_customer_id(opts.notCustomerId)
      if (opts.productId !== undefined) req = req.product_id(opts.productId)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.status !== undefined) req = req.status(opts.status)
      await streamValues(req, opts.format, opts.sortBy);
    } else {
      if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
      if (opts.language !== undefined) req = req.language(opts.language)
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.minFlagCount !== undefined) req = req.min_flag_count(opts.minFlagCount)
      if (opts.notCustomerId !== undefined) req = req.not_customer_id(opts.notCustomerId)
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

  .command("get [...ids]", "Get one or multiple Product Reviews.\n\nhttps://docs.lana.dev/commerce/query/productReviews")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',title:v=>v.title,text:v=>v.text,status:v=>v.status,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,customer_id:v=>v.customer_id,title:v=>v.title,text:v=>v.text,status:v=>v.status,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:product_reviews.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Product Reviews.\n\nhttps://docs.lana.dev/commerce/mutation/productReviewsDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:product_reviews.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Product Reviews.\n\nhttps://docs.lana.dev/commerce/mutation/productReviewsCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--product-id <string>", "(required) A unique product identifier.")
  .option("--text <string>", "(required) Text of the review.")
  .option("--title <string>", "(required) Title of the review.")
  .option("--customer-id <string>", "Unique customer identifier.")
  .option("--flag-ignore <boolean:boolean>", "Whether flagging actions are ignored.")
  .option("--image-file-ids <json>", "", { value: v => JSON.parse(v) })
  .option("--recommended <enum>", "Whether customer voted or not and how.")
  .option("--scores <json>", "", { value: v => JSON.parse(v) })
  .option("--status <enum>", "Publishing approval status.")
  .option("--survey-answers <json>", "", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:product_reviews.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      productId: "product_id",
      text: "text",
      title: "title",
      customerId: "customer_id",
      flagIgnore: "flag_ignore",
      imageFileIds: "image_file_ids",
      recommended: "recommended",
      scores: "scores",
      status: "status",
      surveyAnswers: "survey_answers",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Product Reviews.\n\nhttps://docs.lana.dev/commerce/mutation/productReviewsModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--flag-ignore <boolean:boolean>", "Whether flagging actions are ignored.")
  .option("--image-file-ids <json>", "", { value: v => JSON.parse(v) })
  .option("--recommended <enum>", "Whether customer voted or not and how.")
  .option("--scores <json>", "", { value: v => JSON.parse(v) })
  .option("--status <enum>", "Publishing approval status.")
  .option("--survey-answers <json>", "", { value: v => JSON.parse(v) })
  .option("--text <string>", "Text of the review.")
  .option("--title <string>", "Title of the review.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:product_reviews.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      flagIgnore: "flag_ignore",
      imageFileIds: "image_file_ids",
      recommended: "recommended",
      scores: "scores",
      status: "status",
      surveyAnswers: "survey_answers",
      text: "text",
      title: "title",
    }));
    await req.sendUnwrap();
  })

  .command("search", "Search Product Reviews.\n\nhttps://docs.lana.dev/commerce/query/searchReviews")
  .type("searchReviewsSortBy", searchReviewsSortBy)
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:searchReviewsSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--op <enum>", "(required) Combining or comparison operator.")
  .option("--boolean <boolean:boolean>", "Value of the option (if boolean).")
  .option("--context <string>", "Override nesting level context (when automatic logic gives undesired results).")
  .option("--name <string>", "Name of the option.")
  .option("--nil <boolean:boolean>", "Value is nil.")
  .option("--now <boolean:boolean>", "Value is now (rfc3339 time value, server's idea of now).")
  .option("--number <number:number>", "Value of the option (if number).")
  .option("--parent-index <number:number>", "Index of the parent option (usually \"and\", \"or\", \"not\"), -1 if no parent.")
  .option("--text <string>", "Value of the option (if text).")
  .option("--zero <boolean:boolean>", "Value is number zero.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',title:v=>v.title,text:v=>v.text,status:v=>v.status,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,customer_id:v=>v.customer_id,title:v=>v.title,text:v=>v.text,status:v=>v.status,created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:search/reviews.json");
    req = req.expand({ items: true });
    if (opts.limit !== undefined) req = req.limit(opts.limit)
    if (opts.offset !== undefined) req = req.offset(opts.offset)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
    if (opts.sortDesc) req = req.sort_desc(true)
    req = req.data(assembleInputData(opts, true, {
      op: "op",
      boolean: "boolean",
      context: "context",
      name: "name",
      nil: "nil",
      now: "now",
      number: "number",
      parentIndex: "parent_index",
      text: "text",
      zero: "zero",
    }));
    const resp = await req.sendUnwrap();
    printValues(resp.items, opts.format);
  })

  .command("suggest <...query>", "Suggest Product Reviews.\n\nhttps://docs.lana.dev/commerce/query/suggestReviews")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',title:v=>v.title,text:v=>v.text,status:v=>v.status,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,customer_id:v=>v.customer_id,title:v=>v.title,text:v=>v.text,status:v=>v.status,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...query) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:suggest/reviews.json");
    req = req.expand({ items: true });
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data({ query: query.join(" ") });
    const resp = await req.sendUnwrap();
    printValues(resp.items, opts.format);
  })

  .reset();

export default addExtraCommands(cmd);
