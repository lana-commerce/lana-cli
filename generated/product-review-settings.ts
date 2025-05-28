
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/product-review-settings.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Product Review Settings.")
  .action(() => {
    cmd.showHelp();
  })

  .command("get", "Get Product Review Settings.\n\nhttps://docs.lana.dev/commerce/query/productReviewsSettings")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:product_reviews/settings.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValue(resp, opts.format);
  })



  .command("modify", "Modify Product Review Settings.\n\nhttps://docs.lana.dev/commerce/mutation/productReviewsSettingsCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--acceptable-word-list <json>", "If certain words are acceptable by your audience, you can override them using this parameter.", { value: v => JSON.parse(v) })
  .option("--approve-reviews <boolean:boolean>", "Automatically approve reviews.")
  .option("--approve-threshold <number:number>", "Approve reviews only above certain score threshold.")
  .option("--bad-word-list <json>", "Additional list of bad words (we also have internal undisclosed list of words we filter against).", { value: v => JSON.parse(v) })
  .option("--customer-reminder <enum>", "Whether to send an email asking customer for a product review.")
  .option("--customer-reminder-days <number:number>", "When \"customer_reminder\" is \"custom\", this is the number of days to wait before sending an email.")
  .option("--default-review-dimension-set-id <string>", "Default review dimension set unique identifier.")
  .option("--filter-content <boolean:boolean>", "Filter text for explicit content.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:product_reviews/settings.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, false, {
      acceptableWordList: "acceptable_word_list",
      approveReviews: "approve_reviews",
      approveThreshold: "approve_threshold",
      badWordList: "bad_word_list",
      customerReminder: "customer_reminder",
      customerReminderDays: "customer_reminder_days",
      defaultReviewDimensionSetId: "default_review_dimension_set_id",
      filterContent: "filter_content",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
