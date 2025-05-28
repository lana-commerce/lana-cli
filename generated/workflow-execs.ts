
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/workflow-execs.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Workflow Executions.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Workflow Executions.\n\nhttps://docs.lana.dev/commerce/query/workflowsExecsPage")
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--workflow-id <string:string>", "Filter results by a workflow id.", { required: true })
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,started:v=>v.started_at ? new Date(v.started_at).toLocaleString() : '',ended:v=>v.ended_at ? new Date(v.ended_at).toLocaleString() : ''}", "{id:v=>v.id,started_at:v=>v.started_at,ended_at:v=>v.ended_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:workflows/execs/page.json")
    if (opts.stream) {
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.workflowId !== undefined) req = req.workflow_id(opts.workflowId)
      await streamValues(req, opts.format, "ignore");
    } else {
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.workflowId !== undefined) req = req.workflow_id(opts.workflowId)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })





  .command("resume", "Resume Workflow Execution.\n\nhttps://docs.lana.dev/commerce/mutation/workflowsExecsResume")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--workflow-exec-id <string:string>", "Unique workflow execution identifier.", { required: true })
  .option("--workflow-id <string:string>", "Unique workflow identifier.", { required: true })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:workflows/execs/resume.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.workflowExecId !== undefined) req = req.workflow_exec_id(opts.workflowExecId)
    if (opts.workflowId !== undefined) req = req.workflow_id(opts.workflowId)
    await req.sendUnwrap();
  })

  .reset();

export default addExtraCommands(cmd);
