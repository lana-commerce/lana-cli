
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"
import { waitForTaskWithProgressBar } from "../lib/task.ts"
import { downloadFileToFile, uploadFileToFile } from "../lib/file.ts"

const brandsPageSortBy = new EnumType(["created_at"]);
const publishedStatus = new EnumType(["any", "published", "unpublished"]);
const searchBrandsSortBy = new EnumType(["created_at", "title", "updated_at"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/brands.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Brands.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Brands.\n\nhttps://docs.lana.dev/commerce/query/brandsPage")
  .type("brandsPageSortBy", brandsPageSortBy)
  .type("publishedStatus", publishedStatus)
  .option("--created-at-max <datetime:string>", "Filter output by creation date, upper boundary.")
  .option("--created-at-min <datetime:string>", "Filter output by creation date, lower boundary.")
  .option("--featured", "If set, show only featured brands.")
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--published-at-max <datetime:string>", "Filter output by publication date, upper boundary.")
  .option("--published-at-min <datetime:string>", "Filter output by publication date, lower boundary.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:brandsPageSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--status <enum:publishedStatus>", "Filter output by published status.")
  .option("--updated-at-max <datetime:string>", "Filter output by last update date, upper boundary.")
  .option("--updated-at-min <datetime:string>", "Filter output by last update date, lower boundary.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,website:v=>v.website,created:v=>new Date(v.created_at).toLocaleString(),published:v=>v.published_at ? new Date(v.published_at).toLocaleString() : ''}", "{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,website:v=>v.website,created_at:v=>v.created_at,published_at:v=>v.published_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:brands/page.json")
    if (opts.stream) {
      if (opts.createdAtMax !== undefined) req = req.created_at_max(opts.createdAtMax)
      if (opts.createdAtMin !== undefined) req = req.created_at_min(opts.createdAtMin)
      if (opts.featured) req = req.featured(true)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.publishedAtMax !== undefined) req = req.published_at_max(opts.publishedAtMax)
      if (opts.publishedAtMin !== undefined) req = req.published_at_min(opts.publishedAtMin)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.status !== undefined) req = req.status(opts.status)
      if (opts.updatedAtMax !== undefined) req = req.updated_at_max(opts.updatedAtMax)
      if (opts.updatedAtMin !== undefined) req = req.updated_at_min(opts.updatedAtMin)
      await streamValues(req, opts.format, opts.sortBy);
    } else {
      if (opts.createdAtMax !== undefined) req = req.created_at_max(opts.createdAtMax)
      if (opts.createdAtMin !== undefined) req = req.created_at_min(opts.createdAtMin)
      if (opts.featured) req = req.featured(true)
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      if (opts.publishedAtMax !== undefined) req = req.published_at_max(opts.publishedAtMax)
      if (opts.publishedAtMin !== undefined) req = req.published_at_min(opts.publishedAtMin)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.status !== undefined) req = req.status(opts.status)
      if (opts.updatedAtMax !== undefined) req = req.updated_at_max(opts.updatedAtMax)
      if (opts.updatedAtMin !== undefined) req = req.updated_at_min(opts.updatedAtMin)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })

  .command("get [...ids]", "Get one or multiple Brands.\n\nhttps://docs.lana.dev/commerce/query/brands")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,website:v=>v.website,created:v=>new Date(v.created_at).toLocaleString(),published:v=>v.published_at ? new Date(v.published_at).toLocaleString() : ''}", "{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,website:v=>v.website,created_at:v=>v.created_at,published_at:v=>v.published_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:brands.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Brands.\n\nhttps://docs.lana.dev/commerce/mutation/brandsDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:brands.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Brands.\n\nhttps://docs.lana.dev/commerce/mutation/brandsCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--title <string>", "(required) The name of the brand.")
  .option("--custom-fields <json>", "", { value: v => JSON.parse(v) })
  .option("--featured <boolean:boolean>", "States whether or not the brand is featured.")
  .option("--handle <string>", "An URL-friendly unique string for the brand automatically generated from its title.")
  .option("--image-file-ids <json>", "", { value: v => JSON.parse(v) })
  .option("--meta-description <string>", "Meta description for SEO purposes.")
  .option("--meta-title <string>", "SEO-friendly title of the brand.")
  .option("--published <boolean:boolean>", "Whether server thinks brand is published or not (depends on server time).")
  .option("--published-at <datetime>", "The date and time when the brand was published or null.")
  .option("--raw-content <string>", "Raw content of the brand.")
  .option("--sort-order <enum>", "The default order in which products on the brand page are listed.")
  .option("--website <string>", "Brand home page.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:brands.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      title: "title",
      customFields: "custom_fields",
      featured: "featured",
      handle: "handle",
      imageFileIds: "image_file_ids",
      metaDescription: "meta_description",
      metaTitle: "meta_title",
      published: "published",
      publishedAt: "published_at",
      rawContent: "raw_content",
      sortOrder: "sort_order",
      website: "website",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Brands.\n\nhttps://docs.lana.dev/commerce/mutation/brandsModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--custom-fields <json>", "", { value: v => JSON.parse(v) })
  .option("--featured <boolean:boolean>", "States whether or not the brand is featured.")
  .option("--handle <string>", "An URL-friendly unique string for the brand automatically generated from its title.")
  .option("--image-file-ids <json>", "", { value: v => JSON.parse(v) })
  .option("--meta-description <string>", "Meta description for SEO purposes.")
  .option("--meta-title <string>", "SEO-friendly title of the brand.")
  .option("--published <boolean:boolean>", "Whether server thinks brand is published or not (depends on server time).")
  .option("--published-at <datetime>", "The date and time when the brand was published or null.")
  .option("--raw-content <string>", "Raw content of the brand.")
  .option("--sort-order <enum>", "The default order in which products on the brand page are listed.")
  .option("--title <string>", "The name of the brand.")
  .option("--website <string>", "Brand home page.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:brands.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      customFields: "custom_fields",
      featured: "featured",
      handle: "handle",
      imageFileIds: "image_file_ids",
      metaDescription: "meta_description",
      metaTitle: "meta_title",
      published: "published",
      publishedAt: "published_at",
      rawContent: "raw_content",
      sortOrder: "sort_order",
      title: "title",
      website: "website",
    }));
    await req.sendUnwrap();
  })

  .command("search", "Search Brands.\n\nhttps://docs.lana.dev/commerce/query/searchBrands")
  .type("searchBrandsSortBy", searchBrandsSortBy)
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:searchBrandsSortBy>", "Whether to sort output in some specific way.")
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
    value: formatParser("{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,website:v=>v.website,created:v=>new Date(v.created_at).toLocaleString(),published:v=>v.published_at ? new Date(v.published_at).toLocaleString() : ''}", "{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,website:v=>v.website,created_at:v=>v.created_at,published_at:v=>v.published_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:search/brands.json");
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

  .command("suggest <...query>", "Suggest Brands.\n\nhttps://docs.lana.dev/commerce/query/suggestBrands")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,website:v=>v.website,created:v=>new Date(v.created_at).toLocaleString(),published:v=>v.published_at ? new Date(v.published_at).toLocaleString() : ''}", "{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,website:v=>v.website,created_at:v=>v.created_at,published_at:v=>v.published_at}"),
  })
  .action(async (opts, ...query) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:suggest/brands.json");
    req = req.expand({ items: true });
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data({ query: query.join(" ") });
    const resp = await req.sendUnwrap();
    printValues(resp.items, opts.format);
  })

  .command("export [output]", "Export Brands.\n\nGet info on available CSV columns using this command: `info-csv-format get --name brand`\n\nhttps://docs.lana.dev/commerce/mutation/brandsExport")
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
    let req = request(ctx, "POST:brands/export.json");
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
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Exporting Brands.");
    const fileID = t?.result_file?.id;
    if (!fileID) throw new Error("file id is missing in task result");
    if (output) {
      await downloadFileToFile(ctx, shopID, fileID, output);
    } else {
      console.log(`Export result is saved to file: ${fileID}`);
    }
  })

  .command("import <input>", "Import Brands.\n\nGet info on available CSV columns using this command: `info-csv-format get --name brand`\n\nhttps://docs.lana.dev/commerce/mutation/brandsImport")
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
    let req = request(ctx, "POST:brands/import.json");
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
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Importing Brands.");
    if (t && t.errors.length > 0) {
      console.log("Errors:");
      for (const e of t.errors) {
        console.log(e.message);
      }
    }
  })

  .reset();

export default addExtraCommands(cmd);
