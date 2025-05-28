
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/webhook-status.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Webhook Status.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Webhook Status.\n\nhttps://docs.lana.dev/commerce/query/webhooksStatusPage")
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--webhook-id <string:string>", "Filter results by a webhook id.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{event:v=>v.event.id,webhook:v=>v.webhook.id,outcome:v=>v.last_attempt_outcome}", "{event_id:v=>v.event.id,webhook_id:v=>v.webhook.id,outcome:v=>v.last_attempt_outcome}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:webhooks/status/page.json")
    if (opts.stream) {
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.webhookId !== undefined) req = req.webhook_id(opts.webhookId)
      await streamValues(req, opts.format, "ignore");
    } else {
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.webhookId !== undefined) req = req.webhook_id(opts.webhookId)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })






  .reset();

export default addExtraCommands(cmd);
