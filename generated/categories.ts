
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"
import { waitForTaskWithProgressBar } from "../lib/task.ts"
import { downloadFileToFile, uploadFileToFile } from "../lib/file.ts"

const searchCategoriesSortBy = new EnumType(["created_at", "title", "updated_at"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/categories.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Categories.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Categories.\n\nhttps://docs.lana.dev/commerce/query/categories")
  .option("--children-of <string:string>", "Unique category identifier.")
  .option("--featured", "If set, show only featured categories.")
  .option("--published", "If set, show only published categories.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,'has children':v=>v.has_children?'Yes':'No',created:v=>new Date(v.created_at).toLocaleString(),published:v=>v.published_at ? new Date(v.published_at).toLocaleString() : ''}", "{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,has_children:v=>v.has_children,created_at:v=>v.created_at,published_at:v=>v.published_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:categories.json")
    if (opts.childrenOf !== undefined) req = req.children_of(opts.childrenOf)
    if (opts.featured) req = req.featured(true)
    if (opts.published) req = req.published(true)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Categories.\n\nhttps://docs.lana.dev/commerce/query/categories")
  .option("--children-of <string:string>", "Unique category identifier.")
  .option("--featured", "If set, show only featured categories.")
  .option("--published", "If set, show only published categories.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,'has children':v=>v.has_children?'Yes':'No',created:v=>new Date(v.created_at).toLocaleString(),published:v=>v.published_at ? new Date(v.published_at).toLocaleString() : ''}", "{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,has_children:v=>v.has_children,created_at:v=>v.created_at,published_at:v=>v.published_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:categories.json")
    req = req.ids(ids)
    if (opts.childrenOf !== undefined) req = req.children_of(opts.childrenOf)
    if (opts.featured) req = req.featured(true)
    if (opts.published) req = req.published(true)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Categories.\n\nhttps://docs.lana.dev/commerce/mutation/categoriesDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:categories.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Categories.\n\nhttps://docs.lana.dev/commerce/mutation/categoriesCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--title <string>", "(required) The name of the category.")
  .option("--custom-fields <json>", "", { value: v => JSON.parse(v) })
  .option("--featured <boolean:boolean>", "States whether or not the category is featured.")
  .option("--handle <string>", "An URL-friendly unique string for the category automatically generated from its title.")
  .option("--image-file-ids <json>", "", { value: v => JSON.parse(v) })
  .option("--meta-description <string>", "Meta description for SEO purposes.")
  .option("--meta-title <string>", "SEO-friendly title of the category.")
  .option("--parent-id <string>", "Parent category ID, specify it to create a nested category.")
  .option("--published <boolean:boolean>", "Whether server thinks category is published or not (depends on server time).")
  .option("--published-at <datetime>", "The date and time when the category was published or null.")
  .option("--raw-content <string>", "Raw content of the category.")
  .option("--sort-order <enum>", "The default order in which products in the category appear.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:categories.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      title: "title",
      customFields: "custom_fields",
      featured: "featured",
      handle: "handle",
      imageFileIds: "image_file_ids",
      metaDescription: "meta_description",
      metaTitle: "meta_title",
      parentId: "parent_id",
      published: "published",
      publishedAt: "published_at",
      rawContent: "raw_content",
      sortOrder: "sort_order",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Categories.\n\nhttps://docs.lana.dev/commerce/mutation/categoriesModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--custom-fields <json>", "", { value: v => JSON.parse(v) })
  .option("--featured <boolean:boolean>", "States whether or not the category is featured.")
  .option("--handle <string>", "An URL-friendly unique string for the category automatically generated from its title.")
  .option("--image-file-ids <json>", "", { value: v => JSON.parse(v) })
  .option("--meta-description <string>", "Meta description for SEO purposes.")
  .option("--meta-title <string>", "SEO-friendly title of the category.")
  .option("--parent-id <string>", "Parent category ID, specify it to create a nested category.")
  .option("--published <boolean:boolean>", "Whether server thinks category is published or not (depends on server time).")
  .option("--published-at <datetime>", "The date and time when the category was published or null.")
  .option("--raw-content <string>", "Raw content of the category.")
  .option("--sort-order <enum>", "The default order in which products in the category appear.")
  .option("--title <string>", "The name of the category.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:categories.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      customFields: "custom_fields",
      featured: "featured",
      handle: "handle",
      imageFileIds: "image_file_ids",
      metaDescription: "meta_description",
      metaTitle: "meta_title",
      parentId: "parent_id",
      published: "published",
      publishedAt: "published_at",
      rawContent: "raw_content",
      sortOrder: "sort_order",
      title: "title",
    }));
    await req.sendUnwrap();
  })

  .command("search", "Search Categories.\n\nhttps://docs.lana.dev/commerce/query/searchCategories")
  .type("searchCategoriesSortBy", searchCategoriesSortBy)
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:searchCategoriesSortBy>", "Whether to sort output in some specific way.")
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
    value: formatParser("{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,'has children':v=>v.has_children?'Yes':'No',created:v=>new Date(v.created_at).toLocaleString(),published:v=>v.published_at ? new Date(v.published_at).toLocaleString() : ''}", "{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,has_children:v=>v.has_children,created_at:v=>v.created_at,published_at:v=>v.published_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:search/categories.json");
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

  .command("suggest <...query>", "Suggest Categories.\n\nhttps://docs.lana.dev/commerce/query/suggestCategories")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,'has children':v=>v.has_children?'Yes':'No',created:v=>new Date(v.created_at).toLocaleString(),published:v=>v.published_at ? new Date(v.published_at).toLocaleString() : ''}", "{id:v=>v.id,title:v=>v.title,handle:v=>v.handle,has_children:v=>v.has_children,created_at:v=>v.created_at,published_at:v=>v.published_at}"),
  })
  .action(async (opts, ...query) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:suggest/categories.json");
    req = req.expand({ items: true });
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data({ query: query.join(" ") });
    const resp = await req.sendUnwrap();
    printValues(resp.items, opts.format);
  })

  .command("export [output]", "Export Categories.\n\nGet info on available CSV columns using this command: `info-csv-format get --name category`\n\nhttps://docs.lana.dev/commerce/mutation/categoriesExport")
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
    let req = request(ctx, "POST:categories/export.json");
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
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Exporting Categories.");
    const fileID = t?.result_file?.id;
    if (!fileID) throw new Error("file id is missing in task result");
    if (output) {
      await downloadFileToFile(ctx, shopID, fileID, output);
    } else {
      console.log(`Export result is saved to file: ${fileID}`);
    }
  })

  .command("import <input>", "Import Categories.\n\nGet info on available CSV columns using this command: `info-csv-format get --name category`\n\nhttps://docs.lana.dev/commerce/mutation/categoriesImport")
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
    let req = request(ctx, "POST:categories/import.json");
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
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Importing Categories.");
    if (t && t.errors.length > 0) {
      console.log("Errors:");
      for (const e of t.errors) {
        console.log(e.message);
      }
    }
  })

  .reset();

export default addExtraCommands(cmd);
