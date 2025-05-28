
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/data-feeds.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Data Feeds.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Data Feeds.\n\nhttps://docs.lana.dev/commerce/query/dataFeeds")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,url:v=>v.url,schedule:v=>v.schedule,status:v=>v.status}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:data_feeds.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Data Feeds.\n\nhttps://docs.lana.dev/commerce/query/dataFeeds")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,url:v=>v.url,schedule:v=>v.schedule,status:v=>v.status}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:data_feeds.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Data Feeds.\n\nhttps://docs.lana.dev/commerce/mutation/dataFeedsDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:data_feeds.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Data Feeds.\n\nhttps://docs.lana.dev/commerce/mutation/dataFeedsCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--name <string>", "(required) The name of the data feed.")
  .option("--align-day <number:number>", "Align the generation time to this week day (1 to 31).")
  .option("--align-minute <number:number>", "Align the generation time to this minute offset (-2880 to 2880).")
  .option("--align-weekday <number:number>", "Align the generation time to this week day (0 to 6, Monday is 0).")
  .option("--fields <json>", "", { value: v => JSON.parse(v) })
  .option("--filename <string>", "File name of the data feed without extension.")
  .option("--filter-fields <string>", "A fields specification to filter out data's unused fields (for the filter script).")
  .option("--filter-script <string>", "A script to filter the products/variants (JavaScript).")
  .option("--options <json>", "", { value: v => JSON.parse(v) })
  .option("--password <string>", "Password for http basic auth protected access.")
  .option("--schedule <enum>", "How often data feed is updated.")
  .option("--template-footer <string>", "Custom footer template to use for generating the data feed.")
  .option("--template-header <string>", "Custom header template to use for generating the data feed.")
  .option("--template-item <string>", "Custom item template to use for generating the data feed.")
  .option("--username <string>", "User name for http basic auth protected access.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:data_feeds.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      name: "name",
      alignDay: "align_day",
      alignMinute: "align_minute",
      alignWeekday: "align_weekday",
      fields: "fields",
      filename: "filename",
      filterFields: "filter_fields",
      filterScript: "filter_script",
      options: "options",
      password: "password",
      schedule: "schedule",
      templateFooter: "template_footer",
      templateHeader: "template_header",
      templateItem: "template_item",
      username: "username",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Data Feeds.\n\nhttps://docs.lana.dev/commerce/mutation/dataFeedsModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--align-day <number:number>", "Align the generation time to this week day (1 to 31).")
  .option("--align-minute <number:number>", "Align the generation time to this minute offset (-2880 to 2880).")
  .option("--align-weekday <number:number>", "Align the generation time to this week day (0 to 6, Monday is 0).")
  .option("--fields <json>", "", { value: v => JSON.parse(v) })
  .option("--filename <string>", "File name of the data feed without extension.")
  .option("--filter-fields <string>", "A fields specification to filter out data's unused fields (for the filter script).")
  .option("--filter-script <string>", "A script to filter the products/variants (JavaScript).")
  .option("--name <string>", "The name of the data feed.")
  .option("--options <json>", "", { value: v => JSON.parse(v) })
  .option("--password <string>", "Password for http basic auth protected access.")
  .option("--schedule <enum>", "How often data feed is updated.")
  .option("--template-footer <string>", "Custom footer template to use for generating the data feed.")
  .option("--template-header <string>", "Custom header template to use for generating the data feed.")
  .option("--template-item <string>", "Custom item template to use for generating the data feed.")
  .option("--username <string>", "User name for http basic auth protected access.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:data_feeds.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      alignDay: "align_day",
      alignMinute: "align_minute",
      alignWeekday: "align_weekday",
      fields: "fields",
      filename: "filename",
      filterFields: "filter_fields",
      filterScript: "filter_script",
      name: "name",
      options: "options",
      password: "password",
      schedule: "schedule",
      templateFooter: "template_footer",
      templateHeader: "template_header",
      templateItem: "template_item",
      username: "username",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
