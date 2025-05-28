
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/customer-balance.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Customer Balance.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Customer Balance.\n\nhttps://docs.lana.dev/commerce/query/customerBalanceHistory")
  .option("--currency <string:string>", "Filter history by currency.")
  .option("--customer-id <string:string>", "Unique customer identifier.", { required: true })
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,currency:v=>v.currency,amount:v=>formatCurrency(v.amount,v.currency),balance:v=>formatCurrency(v.balance,v.currency),comment:v=>v.comment,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,currency:v=>v.currency,amount:v=>formatCurrency(v.amount,v.currency),balance:v=>formatCurrency(v.balance,v.currency),comment:v=>v.comment,created_at:v=>v.created_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:customer_balance/history.json")
    if (opts.stream) {
      if (opts.currency !== undefined) req = req.currency(opts.currency)
      if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      await streamValues(req, opts.format, "ignore");
    } else {
      if (opts.currency !== undefined) req = req.currency(opts.currency)
      if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })

  .command("get", "Get Customer Balance.\n\nhttps://docs.lana.dev/commerce/query/customerBalance")
  .option("--customer-id <string:string>", "Unique customer identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:customer_balance.json")
    if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValue(resp, opts.format);
  })




  .command("apply-gift-card", "Apply gift card to Customer Balance.\n\nhttps://docs.lana.dev/commerce/mutation/customerBalanceApplyGiftCard")
  .option("--customer-id <string:string>", "Unique customer identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--gift-card-code <string>", "(required) Unique generated gift card code (shop owner/users only).")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:customer_balance/apply_gift_card.json");
    if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, false, {
      giftCardCode: "gift_card_code",
    }));
    await req.sendUnwrap();
  })

  .command("transaction", "Apply a transaction to Customer Balance.\n\nhttps://docs.lana.dev/commerce/mutation/customerBalanceTransactionCreate")
  .option("--customer-id <string:string>", "Unique customer identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--amount <number:number>", "(required) Amount to add/subtract to customer balance.")
  .option("--comment <string>", "Comment describing the change.")
  .option("--currency <string>", "Currency code of the amount to add/subtract (shop's primary by default).")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:customer_balance/transaction.json");
    if (opts.customerId !== undefined) req = req.customer_id(opts.customerId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, false, {
      amount: "amount",
      comment: "comment",
      currency: "currency",
    }));
    await req.sendUnwrap();
  })

  .reset();

export default addExtraCommands(cmd);
