
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"
import { waitForTaskWithProgressBar } from "../lib/task.ts"
import { downloadFileToFile, uploadFileToFile } from "../lib/file.ts"

const contentBlocksPageSortBy = new EnumType(["created_at", "updated_at"]);
const publishedStatus = new EnumType(["any", "published", "unpublished"]);
const searchContentBlocksSortBy = new EnumType(["created_at", "title", "updated_at"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/content-blocks.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Content Blocks.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Content Blocks.\n\nhttps://docs.lana.dev/commerce/query/contentBlocksPage")
  .type("contentBlocksPageSortBy", contentBlocksPageSortBy)
  .type("publishedStatus", publishedStatus)
  .option("--created-at-max <datetime:string>", "Filter output by creation date, upper boundary.")
  .option("--created-at-min <datetime:string>", "Filter output by creation date, lower boundary.")
  .option("--handle <string:string>", "Filter output by content block handle.")
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--published-at-max <datetime:string>", "Filter output by publication date, upper boundary.")
  .option("--published-at-min <datetime:string>", "Filter output by publication date, lower boundary.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:contentBlocksPageSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--status <enum:publishedStatus>", "Filter output by published status.")
  .option("--title <string:string>", "Filter output by content block title.")
  .option("--updated-at-max <datetime:string>", "Filter output by last update date, upper boundary.")
  .option("--updated-at-min <datetime:string>", "Filter output by last update date, lower boundary.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,'is page':v=>v.is_page?'Yes':'No',created:v=>new Date(v.created_at).toLocaleString(),published:v=>v.published_at ? new Date(v.published_at).toLocaleString() : ''}", "{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,is_page:v=>v.is_page,created_at:v=>v.created_at,published_at:v=>v.published_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:content_blocks/page.json")
    if (opts.stream) {
      if (opts.createdAtMax !== undefined) req = req.created_at_max(opts.createdAtMax)
      if (opts.createdAtMin !== undefined) req = req.created_at_min(opts.createdAtMin)
      if (opts.handle !== undefined) req = req.handle(opts.handle)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.publishedAtMax !== undefined) req = req.published_at_max(opts.publishedAtMax)
      if (opts.publishedAtMin !== undefined) req = req.published_at_min(opts.publishedAtMin)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.status !== undefined) req = req.status(opts.status)
      if (opts.title !== undefined) req = req.title(opts.title)
      if (opts.updatedAtMax !== undefined) req = req.updated_at_max(opts.updatedAtMax)
      if (opts.updatedAtMin !== undefined) req = req.updated_at_min(opts.updatedAtMin)
      await streamValues(req, opts.format, opts.sortBy);
    } else {
      if (opts.createdAtMax !== undefined) req = req.created_at_max(opts.createdAtMax)
      if (opts.createdAtMin !== undefined) req = req.created_at_min(opts.createdAtMin)
      if (opts.handle !== undefined) req = req.handle(opts.handle)
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      if (opts.publishedAtMax !== undefined) req = req.published_at_max(opts.publishedAtMax)
      if (opts.publishedAtMin !== undefined) req = req.published_at_min(opts.publishedAtMin)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.status !== undefined) req = req.status(opts.status)
      if (opts.title !== undefined) req = req.title(opts.title)
      if (opts.updatedAtMax !== undefined) req = req.updated_at_max(opts.updatedAtMax)
      if (opts.updatedAtMin !== undefined) req = req.updated_at_min(opts.updatedAtMin)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })

  .command("get [...ids]", "Get one or multiple Content Blocks.\n\nhttps://docs.lana.dev/commerce/query/contentBlocks")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,'is page':v=>v.is_page?'Yes':'No',created:v=>new Date(v.created_at).toLocaleString(),published:v=>v.published_at ? new Date(v.published_at).toLocaleString() : ''}", "{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,is_page:v=>v.is_page,created_at:v=>v.created_at,published_at:v=>v.published_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:content_blocks.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Content Blocks.\n\nhttps://docs.lana.dev/commerce/mutation/contentBlocksDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:content_blocks.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Content Blocks.\n\nhttps://docs.lana.dev/commerce/mutation/contentBlocksCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--title <string>", "(required) The title of the content block.")
  .option("--author <string>", "The name of the person who created the content block.")
  .option("--custom-fields <json>", "", { value: v => JSON.parse(v) })
  .option("--handle <string>", "An URL-friendly unique string for the content block automatically generated from its title.")
  .option("--is-page <boolean:boolean>", "Whether this content block is a page or not (available through router path).")
  .option("--meta-description <string>", "Meta description for SEO purposes.")
  .option("--meta-title <string>", "SEO-friendly title of the content block.")
  .option("--published <boolean:boolean>", "Whether server thinks content block is published or not (depends on server time).")
  .option("--published-at <datetime>", "The date and time when the content block was published or null.")
  .option("--raw-content <string>", "Raw content of the content block.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:content_blocks.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      title: "title",
      author: "author",
      customFields: "custom_fields",
      handle: "handle",
      isPage: "is_page",
      metaDescription: "meta_description",
      metaTitle: "meta_title",
      published: "published",
      publishedAt: "published_at",
      rawContent: "raw_content",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Content Blocks.\n\nhttps://docs.lana.dev/commerce/mutation/contentBlocksModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--author <string>", "The name of the person who created the content block.")
  .option("--custom-fields <json>", "", { value: v => JSON.parse(v) })
  .option("--handle <string>", "An URL-friendly unique string for the content block automatically generated from its title.")
  .option("--is-page <boolean:boolean>", "Whether this content block is a page or not (available through router path).")
  .option("--meta-description <string>", "Meta description for SEO purposes.")
  .option("--meta-title <string>", "SEO-friendly title of the content block.")
  .option("--published <boolean:boolean>", "Whether server thinks content block is published or not (depends on server time).")
  .option("--published-at <datetime>", "The date and time when the content block was published or null.")
  .option("--raw-content <string>", "Raw content of the content block.")
  .option("--title <string>", "The title of the content block.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:content_blocks.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      author: "author",
      customFields: "custom_fields",
      handle: "handle",
      isPage: "is_page",
      metaDescription: "meta_description",
      metaTitle: "meta_title",
      published: "published",
      publishedAt: "published_at",
      rawContent: "raw_content",
      title: "title",
    }));
    await req.sendUnwrap();
  })

  .command("search", "Search Content Blocks.\n\nhttps://docs.lana.dev/commerce/query/searchContentBlocks")
  .type("searchContentBlocksSortBy", searchContentBlocksSortBy)
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:searchContentBlocksSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--op <enum>", "(required) Combining or comparison operator.")
  .option("--boolean <boolean:boolean>", "Value of the option (if boolean).")
  .option("--context <string>", "Override nesting level context (when automatic logic gives undesired results).")
  .option("--name <string>", "Name of the option.")
  .option("--nil <boolean:boolean>", "Value is nil.")
  .option("--now <boolean:boolean>", "Value is now (rfc3339 time value, server's idea of now).")
  .option("--number <number:number>", "Value of the option (if number).")
  .option("--parent-index <number:number>", "Index of the parent option (usually \"and\", \"or\", \"not\"), -1 if no parent.")
  .option("--text <string>", "Value of the option (if text).")
  .option("--zero <boolean:boolean>", "Value is number zero.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,'is page':v=>v.is_page?'Yes':'No',created:v=>new Date(v.created_at).toLocaleString(),published:v=>v.published_at ? new Date(v.published_at).toLocaleString() : ''}", "{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,is_page:v=>v.is_page,created_at:v=>v.created_at,published_at:v=>v.published_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:search/content_blocks.json");
    req = req.expand({ items: true });
    if (opts.limit !== undefined) req = req.limit(opts.limit)
    if (opts.offset !== undefined) req = req.offset(opts.offset)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
    if (opts.sortDesc) req = req.sort_desc(true)
    req = req.data(assembleInputData(opts, true, {
      op: "op",
      boolean: "boolean",
      context: "context",
      name: "name",
      nil: "nil",
      now: "now",
      number: "number",
      parentIndex: "parent_index",
      text: "text",
      zero: "zero",
    }));
    const resp = await req.sendUnwrap();
    printValues(resp.items, opts.format);
  })

  .command("suggest <...query>", "Suggest Content Blocks.\n\nhttps://docs.lana.dev/commerce/query/suggestContentBlocks")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,'is page':v=>v.is_page?'Yes':'No',created:v=>new Date(v.created_at).toLocaleString(),published:v=>v.published_at ? new Date(v.published_at).toLocaleString() : ''}", "{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,is_page:v=>v.is_page,created_at:v=>v.created_at,published_at:v=>v.published_at}"),
  })
  .action(async (opts, ...query) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:suggest/content_blocks.json");
    req = req.expand({ items: true });
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data({ query: query.join(" ") });
    const resp = await req.sendUnwrap();
    printValues(resp.items, opts.format);
  })

  .command("export [output]", "Export Content Blocks.\n\nGet info on available CSV columns using this command: `info-csv-format get --name contentblock`\n\nhttps://docs.lana.dev/commerce/mutation/contentBlocksExport")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--columns <string>", "Comma separated list of columns to include for export.", { value: (v) => v.split(",") })
  .option("--ids <string>", "Comma separated list of ids to include for export.", { value: (v) => v.split(",") })
  .option("--zip", "Compress the resulting file.")
  .option("--date-and-time-format <string:string>", "Format to use for date and time formatting (uses Go library specification).")
  .option("--date-format <string:string>", "Format to use for date formatting (uses Go library specification).")
  .option("--timezone <string:string>", "Timezone to use with date and time formatting.")
  .option("--length-unit <string:string>", "Length unit to use for formatting.")
  .option("--weight-unit <string:string>", "Weight unit to use for formatting.")
  .action(async (opts, output) => {
    const shopID = opts.shopId || getConfigValue("shop_id");
    const ctx = getRequestContext();
    let req = request(ctx, "POST:content_blocks/export.json");
    req = req.shop_id(shopID)
    req = req.data({
      columns: opts.columns,
      ids: opts.ids,
      zip: opts.zip,
      options: {
        date_and_time_format: opts.dateAndTimeFormat || "",
        date_format: opts.dateFormat || "",
        timezone: opts.timezone || "",
        length_unit: (opts.lengthUnit || "mm") as any,
        weight_unit: (opts.weightUnit || "g") as any,
      },
      })
    const resp = await req.sendUnwrap();
    const taskID = resp.task?.id;
    if (!taskID) throw new Error("task id is missing in response");
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Exporting Content Blocks.");
    const fileID = t?.result_file?.id;
    if (!fileID) throw new Error("file id is missing in task result");
    if (output) {
      await downloadFileToFile(ctx, shopID, fileID, output);
    } else {
      console.log(`Export result is saved to file: ${fileID}`);
    }
  })

  .command("import <input>", "Import Content Blocks.\n\nGet info on available CSV columns using this command: `info-csv-format get --name contentblock`\n\nhttps://docs.lana.dev/commerce/mutation/contentBlocksImport")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--columns <string>", "Comma separated list of columns to include for import.", { value: (v) => v.split(","), required: true })
  .option("--no-header", "Specify this option when CSV file has no header.")
  .option("--date-and-time-format <string:string>", "Format to use for date and time formatting (uses Go library specification).")
  .option("--date-format <string:string>", "Format to use for date formatting (uses Go library specification).")
  .option("--timezone <string:string>", "Timezone to use with date and time formatting.")
  .action(async (opts, input) => {
    const shopID = opts.shopId || getConfigValue("shop_id");
    const ctx = getRequestContext();
    const fileID = await uploadFileToFile(ctx, shopID, input);
    let req = request(ctx, "POST:content_blocks/import.json");
    req = req.shop_id(shopID)
    req = req.data({
      file_id: fileID,
      columns: opts.columns,
      skip_header: opts.header,
      options: {
        date_and_time_format: opts.dateAndTimeFormat || "",
        date_format: opts.dateFormat || "",
        timezone: opts.timezone || "",
      },
      })
    const resp = await req.sendUnwrap();
    const taskID = resp.task?.id;
    if (!taskID) throw new Error("task id is missing in response");
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Importing Content Blocks.");
    if (t && t.errors.length > 0) {
      console.log("Errors:");
      for (const e of t.errors) {
        console.log(e.message);
      }
    }
  })

  .reset();

export default addExtraCommands(cmd);
