
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/roles.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Roles.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Roles.\n\nhttps://docs.lana.dev/commerce/query/organizationsRoles")
  .option("--organization-id <string:string>", "Unique organization identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,name:v=>v.name,created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:organizations/roles.json")
    req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Roles.\n\nhttps://docs.lana.dev/commerce/query/organizationsRoles")
  .option("--organization-id <string:string>", "Unique organization identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,name:v=>v.name,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:organizations/roles.json")
    req = req.ids(ids)
    req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Roles.\n\nhttps://docs.lana.dev/commerce/mutation/organizationsRolesDelete")
  .option("--organization-id <string:string>", "Unique organization identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "DELETE:organizations/roles.json")
    req = req.ids(ids)
    req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Roles.\n\nhttps://docs.lana.dev/commerce/mutation/organizationsRolesCreate")
  .option("--organization-id <string:string>", "Unique organization identifier.")
  .option("--name <string>", "The name of the role.")
  .option("--permissions <json>", "A set of permission bits describing this role.", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "POST:organizations/roles.json");
    req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
    req = req.data(assembleInputData(opts, true, {
      name: "name",
      permissions: "permissions",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Roles.\n\nhttps://docs.lana.dev/commerce/mutation/organizationsRolesModify")
  .option("--organization-id <string:string>", "Unique organization identifier.")
  .option("--name <string>", "The name of the role.")
  .option("--permissions <json>", "A set of permission bits describing this role.", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "POST:organizations/roles.json").ids(ids);
    req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
    req = req.data(assembleInputData(opts, true, {
      name: "name",
      permissions: "permissions",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
