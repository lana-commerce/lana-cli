
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"

const fileStorage = new EnumType(["general", "private"]);
const filesPageSortBy = new EnumType(["created_at"]);
const imageType = new EnumType(["image"]);
const searchFilesSortBy = new EnumType(["created_at", "mime", "name", "size"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/files.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Files.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Files.\n\nhttps://docs.lana.dev/commerce/query/filesPage")
  .type("fileStorage", fileStorage)
  .type("filesPageSortBy", filesPageSortBy)
  .type("imageType", imageType)
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:filesPageSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--storage <enum:fileStorage>", "Filter files by storage type.")
  .option("--type <enum:imageType>", "Filter files by type.")
  .option("--uploaded", "Filter files by upload status.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,storage:v=>v.storage,name:v=>v.name,mime:v=>v.mime,size:v=>formatSize(v.size),created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,storage:v=>v.storage,name:v=>v.name,mime:v=>v.mime,size:v=>v.size,created_at:v=>v.created_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:files/page.json")
    if (opts.stream) {
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.storage !== undefined) req = req.storage(opts.storage)
      if (opts.type !== undefined) req = req.type(opts.type)
      if (opts.uploaded) req = req.uploaded(true)
      await streamValues(req, opts.format, opts.sortBy);
    } else {
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.storage !== undefined) req = req.storage(opts.storage)
      if (opts.type !== undefined) req = req.type(opts.type)
      if (opts.uploaded) req = req.uploaded(true)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })

  .command("get [...ids]", "Get one or multiple Files.\n\nhttps://docs.lana.dev/commerce/query/files")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,storage:v=>v.storage,name:v=>v.name,mime:v=>v.mime,size:v=>formatSize(v.size),created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,storage:v=>v.storage,name:v=>v.name,mime:v=>v.mime,size:v=>v.size,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:files.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Files.\n\nhttps://docs.lana.dev/commerce/mutation/filesDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:files.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Files.\n\nhttps://docs.lana.dev/commerce/mutation/filesCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--base64 <string>", "Base64 encoded file or image.")
  .option("--content-type <string>", "Override default content type of the file.")
  .option("--image-alt <string>", "Alt title of the image.")
  .option("--name <string>", "Filename, will be used to construct a unique file path.")
  .option("--pinned <boolean:boolean>", "Whether file is pinned or not.")
  .option("--size <string>", "Size of the file to be uploaded (deferred uploads).")
  .option("--storage <enum>", "File storage type.")
  .option("--text <string>", "Text if the file is a plain text file.")
  .option("--url <string>", "An URL to download file or image from.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:files.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      base64: "base64",
      contentType: "content_type",
      imageAlt: "image_alt",
      name: "name",
      pinned: "pinned",
      size: "size",
      storage: "storage",
      text: "text",
      url: "url",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Files.\n\nhttps://docs.lana.dev/commerce/mutation/filesModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--image-alt <string>", "Alt title of the image.")
  .option("--pinned <boolean:boolean>", "Whether file is pinned or not.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:files.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      imageAlt: "image_alt",
      pinned: "pinned",
    }));
    await req.sendUnwrap();
  })

  .command("stats", "Get Files statistics.\n\nhttps://docs.lana.dev/commerce/query/filesStats")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:files/stats.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValue(resp, opts.format);
  })

  .command("search", "Search Files.\n\nhttps://docs.lana.dev/commerce/query/searchFiles")
  .type("searchFilesSortBy", searchFilesSortBy)
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:searchFilesSortBy>", "Whether to sort output in some specific way.")
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
    value: formatParser("{id:v=>v.id,storage:v=>v.storage,name:v=>v.name,mime:v=>v.mime,size:v=>formatSize(v.size),created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,storage:v=>v.storage,name:v=>v.name,mime:v=>v.mime,size:v=>v.size,created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:search/files.json");
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

  .command("suggest <...query>", "Suggest Files.\n\nhttps://docs.lana.dev/commerce/query/suggestFiles")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--only-images <boolean:boolean>", "Restrict search to only images.")
  .option("--only-uploaded-private-files <boolean:boolean>", "Restrict search to uploaded private files.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,storage:v=>v.storage,name:v=>v.name,mime:v=>v.mime,size:v=>formatSize(v.size),created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,storage:v=>v.storage,name:v=>v.name,mime:v=>v.mime,size:v=>v.size,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...query) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:suggest/files.json");
    req = req.expand({ items: true });
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data({ query: query.join(" ") });
    const resp = await req.sendUnwrap();
    printValues(resp.items, opts.format);
  })

  .reset();

export default addExtraCommands(cmd);
