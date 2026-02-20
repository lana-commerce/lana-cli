
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/entities.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Entities.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Entities.\n\nhttps://docs.lana.dev/commerce/query/entitiesPage")
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--organization-id <string:string>", "Filter output by organization.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,name:v=>v.name,created_at:v=>v.created_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:entities/page.json")
    if (opts.stream) {
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
      await streamValues(req, opts.format, "ignore");
    } else {
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })

  .command("get", "Get Entity.\n\nhttps://docs.lana.dev/commerce/query/entities")
  .option("--entity-id <string:string>", "Unique entity identifier.", { required: true })
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,name:v=>v.name,created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:entities.json")
    if (opts.entityId !== undefined) req = req.entity_id(opts.entityId)
    const resp = await req.sendUnwrap();
    printValue(resp[0], opts.format);
  })


  .command("create", "Create one or multiple Entities.\n\nhttps://docs.lana.dev/commerce/mutation/entitiesCreate")
  .option("--entity-id <string:string>", "Unique entity identifier.")
  .option("--name <string>", "(required) The name of the entity.")
  .option("--organization-id <string>", "(required) Organization this entity belongs to.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "POST:entities.json");
    if (opts.entityId !== undefined) req = req.entity_id(opts.entityId)
    req = req.data(assembleInputData(opts, true, {
      name: "name",
      organizationId: "organization_id",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify", "Modify Entity.\n\nhttps://docs.lana.dev/commerce/mutation/entitiesModify")
  .option("--entity-id <string:string>", "Unique entity identifier.")
  .option("--name <string>", "The name of the entity.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "POST:entities.json");
    if (opts.entityId !== undefined) req = req.entity_id(opts.entityId)
    req = req.data(assembleInputData(opts, true, {
      name: "name",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
