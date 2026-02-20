
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"

const invoiceType = new EnumType(["any", "nonzero"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/invoices.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Invoices.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Invoices.\n\nhttps://docs.lana.dev/commerce/query/organizationsInvoicesPage")
  .type("invoiceType", invoiceType)
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--organization-id <string:string>", "Unique organization identifier.")
  .option("--type <enum:invoiceType>", "Filter invoices by type.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,number:v=>v.number,status:v=>v.status}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:organizations/invoices/page.json")
    if (opts.stream) {
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
      if (opts.type !== undefined) req = req.type(opts.type)
      await streamValues(req, opts.format, "ignore");
    } else {
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
      if (opts.type !== undefined) req = req.type(opts.type)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })

  .command("get [...ids]", "Get one or multiple Invoices.\n\nhttps://docs.lana.dev/commerce/query/organizationsInvoices")
  .option("--organization-id <string:string>", "Unique organization identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,number:v=>v.number,status:v=>v.status}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:organizations/invoices.json")
    req = req.ids(ids)
    req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })





  .reset();

export default addExtraCommands(cmd);
