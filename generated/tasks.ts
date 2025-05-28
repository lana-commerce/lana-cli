
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/tasks.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Tasks.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Tasks.\n\nhttps://docs.lana.dev/commerce/query/shardedTasks")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,done:v=>v.is_done?'Yes':'No','result file':v=>v.result_file?.id||'',created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,name:v=>v.name,is_done:v=>v.is_done,result_file:v=>v.result_file?.id||'',created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:sharded_tasks.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp.items, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Tasks.\n\nhttps://docs.lana.dev/commerce/query/shardedTasks")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,done:v=>v.is_done?'Yes':'No','result file':v=>v.result_file?.id||'',created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,name:v=>v.name,is_done:v=>v.is_done,result_file:v=>v.result_file?.id||'',created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:sharded_tasks.json")
    req = req.expand({ items: true })
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp.items[0], opts.format); } else { printValues(resp.items, opts.format); }
  })





  .reset();

export default addExtraCommands(cmd);
