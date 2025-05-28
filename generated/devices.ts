
import { Command } from "@cliffy/command"
import { getRequestContext } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/devices.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Devices.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Devices.\n\nhttps://docs.lana.dev/commerce/query/devices")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,'device id':v=>v.device_id,ip:v=>v.ip,trusted:v=>v.trusted?'Yes':'No','logged in':v=>new Date(v.logged_in_at).toLocaleString(),created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,device_id:v=>v.device_id,ip:v=>v.ip,trusted:v=>v.trusted,logged_in_at:v=>v.logged_in_at,created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:devices.json")
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })


  .command("delete <...ids>", "Delete one or multiple Devices.\n\nhttps://docs.lana.dev/commerce/mutation/devicesDelete")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "DELETE:devices.json")
    req = req.ids(ids)
    await req.sendUnwrap();
  })


  .command("modify <ids...>", "Modify one or multiple Devices.\n\nhttps://docs.lana.dev/commerce/mutation/devices")
  .option("--trusted <boolean:boolean>", "Whether this device is marked as trusted.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "POST:devices.json").ids(ids);
    req = req.data(assembleInputData(opts, true, {
      trusted: "trusted",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
