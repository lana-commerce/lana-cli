
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/workflows.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Workflows.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Workflows.\n\nhttps://docs.lana.dev/commerce/query/workflows")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,trigger:v=>v.trigger||'manual',enabled:v=>v.enabled?'Yes':'No'}", "{id:v=>v.id,name:v=>v.name,trigger:v=>v.trigger,enabled:v=>v.enabled}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:workflows.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Workflows.\n\nhttps://docs.lana.dev/commerce/query/workflows")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,trigger:v=>v.trigger||'manual',enabled:v=>v.enabled?'Yes':'No'}", "{id:v=>v.id,name:v=>v.name,trigger:v=>v.trigger,enabled:v=>v.enabled}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:workflows.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Workflows.\n\nhttps://docs.lana.dev/commerce/mutation/workflowsDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:workflows.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Workflows.\n\nhttps://docs.lana.dev/commerce/mutation/workflowsCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--name <string>", "(required) Name of the workflow.")
  .option("--api-key-id <string>", "API Key to use for API calls.")
  .option("--description <string>", "Description of the workflow.")
  .option("--enabled <boolean:boolean>", "Whether this workflow is enabled or not.")
  .option("--script <string>", "A script to execute for the workflow (JavaScript).")
  .option("--trigger <string>", "A trigger.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:workflows.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      name: "name",
      apiKeyId: "api_key_id",
      description: "description",
      enabled: "enabled",
      script: "script",
      trigger: "trigger",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Workflows.\n\nhttps://docs.lana.dev/commerce/mutation/workflowsModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--api-key-id <string>", "API Key to use for API calls.")
  .option("--description <string>", "Description of the workflow.")
  .option("--enabled <boolean:boolean>", "Whether this workflow is enabled or not.")
  .option("--name <string>", "Name of the workflow.")
  .option("--script <string>", "A script to execute for the workflow (JavaScript).")
  .option("--trigger <string>", "A trigger.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:workflows.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      apiKeyId: "api_key_id",
      description: "description",
      enabled: "enabled",
      name: "name",
      script: "script",
      trigger: "trigger",
    }));
    await req.sendUnwrap();
  })

  .command("execute", "Execute Workflow.\n\nhttps://docs.lana.dev/commerce/mutation/workflowsExecute")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--workflow-id <string:string>", "Unique workflow identifier.", { required: true })
  .option("--data <string>", "Workflow execution input data as JSON.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:workflows/execute.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.workflowId !== undefined) req = req.workflow_id(opts.workflowId)
    req = req.data(assembleInputData(opts, false, {
      data: "data",
    }));
    await req.sendUnwrap();
  })

  .reset();

export default addExtraCommands(cmd);
