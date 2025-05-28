
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"

const approvalStatus = new EnumType(["approved", "disapproved", "pending"]);
const productQuestionsAnswersPageSortBy = new EnumType(["created_at"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/product-question-answers.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Product Question Answers.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Product Question Answers.\n\nhttps://docs.lana.dev/commerce/query/productQuestionsAnswersPage")
  .type("approvalStatus", approvalStatus)
  .type("productQuestionsAnswersPageSortBy", productQuestionsAnswersPageSortBy)
  .option("--customer-id <string:string>", "Filter output by customer.")
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--min-flag-count <number:number>", "Filter by flag count (inclusive).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--product-id <string:string>", "Filter output by product.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:productQuestionsAnswersPageSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--status <enum:approvalStatus>", "Publishing approval status.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',user:v=>v.user_id||'',text:v=>v.text,status:v=>v.status,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,customer_id:v=>v.customer_id,user_id:v=>v.user_id,text:v=>v.text,status:v=>v.status,created_at:v=>v.created_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:product_questions/answers/page.json")
    if (opts.stream) {
      if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.minFlagCount !== undefined) req = req.min_flag_count(opts.minFlagCount)
      if (opts.productId !== undefined) req = req.product_id(opts.productId)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.status !== undefined) req = req.status(opts.status)
      await streamValues(req, opts.format, opts.sortBy);
    } else {
      if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
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

  .command("get [...ids]", "Get one or multiple Product Question Answers.\n\nhttps://docs.lana.dev/commerce/query/productQuestionsAnswers")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,customer:v=>v.customer_id||'',user:v=>v.user_id||'',text:v=>v.text,status:v=>v.status,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,customer_id:v=>v.customer_id,user_id:v=>v.user_id,text:v=>v.text,status:v=>v.status,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:product_questions/answers.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Product Question Answers.\n\nhttps://docs.lana.dev/commerce/mutation/productQuestionsAnswersDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:product_questions/answers.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Product Question Answers.\n\nhttps://docs.lana.dev/commerce/mutation/productQuestionsAnswersCreate")
  .option("--question-id <string:string>", "Subject question identifier.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--text <string>", "(required) Text of the answer.")
  .option("--flag-ignore <boolean:boolean>", "Whether flagging actions are ignored.")
  .option("--status <enum>", "Publishing approval status.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:product_questions/answers.json");
    if (opts.questionId !== undefined) req = req.question_id(opts.questionId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      text: "text",
      flagIgnore: "flag_ignore",
      status: "status",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Product Question Answers.\n\nhttps://docs.lana.dev/commerce/mutation/productQuestionsAnswersModify")
  .option("--question-id <string:string>", "Subject question identifier.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--flag-ignore <boolean:boolean>", "Whether flagging actions are ignored.")
  .option("--status <enum>", "Publishing approval status.")
  .option("--text <string>", "Text of the answer.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:product_questions/answers.json").ids(ids);
    if (opts.questionId !== undefined) req = req.question_id(opts.questionId)
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
