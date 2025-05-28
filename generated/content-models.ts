
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/content-models.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Content Models.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Content Models.\n\nhttps://docs.lana.dev/commerce/query/contentModels")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,label:v=>v.label,builtin:v=>v.builtin?'Yes':'No'}", "{id:v=>v.id,name:v=>v.name,label:v=>v.label,builtin:v=>v.builtin}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:content_models.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Content Models.\n\nhttps://docs.lana.dev/commerce/query/contentModels")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,label:v=>v.label,builtin:v=>v.builtin?'Yes':'No'}", "{id:v=>v.id,name:v=>v.name,label:v=>v.label,builtin:v=>v.builtin}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:content_models.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Content Models.\n\nhttps://docs.lana.dev/commerce/mutation/contentModelsDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:content_models.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Content Models.\n\nhttps://docs.lana.dev/commerce/mutation/contentModelsCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--json <string>", "(required) JSON description of the model (as a string).")
  .option("--label <string>", "(required) Label of the content model for UI.")
  .option("--name <string>", "(required) User provided name of the content, must be unique.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:content_models.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      json: "json",
      label: "label",
      name: "name",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Content Models.\n\nhttps://docs.lana.dev/commerce/mutation/contentModelsModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--json <string>", "JSON description of the model (as a string).")
  .option("--label <string>", "Label of the content model for UI.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:content_models.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      json: "json",
      label: "label",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
