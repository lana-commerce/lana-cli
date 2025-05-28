
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"

const productVariantsPageSortBy = new EnumType(["created_at"]);
const searchVariantsSortBy = new EnumType(["available", "bin_location", "committed", "created_at", "incoming", "low_stock_level", "on_hand", "sku", "title"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/product-variants.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Product Variants.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Product Variants.\n\nhttps://docs.lana.dev/commerce/query/productVariantsPage")
  .type("productVariantsPageSortBy", productVariantsPageSortBy)
  .option("--ignore-bundles", "Ignore bundle type variants.")
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--no-inventory", "Show only variants which have no inventory entry.")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:productVariantsPageSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,type:v=>v.type,sku:v=>v.sku,price:v=>formatCurrency(v.price),width:v=>`${v.width}mm`,height:v=>`${v.height}mm`,length:v=>`${v.length}mm`,weight:v=>`${v.grams}g`,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,type:v=>v.type,sku:v=>v.sku,price:v=>formatCurrency(v.price),width:v=>v.width,height:v=>v.height,length:v=>v.length,grams:v=>v.grams,created_at:v=>v.created_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:product_variants/page.json")
    if (opts.stream) {
      if (opts.ignoreBundles) req = req.ignore_bundles(true)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (!opts.inventory) req = req.no_inventory(true)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      await streamValues(req, opts.format, opts.sortBy);
    } else {
      if (opts.ignoreBundles) req = req.ignore_bundles(true)
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (!opts.inventory) req = req.no_inventory(true)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })

  .command("get [...ids]", "Get one or multiple Product Variants.\n\nhttps://docs.lana.dev/commerce/query/productVariants")
  .option("--product-id <string:string>", "Unique product identifier.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,type:v=>v.type,sku:v=>v.sku,price:v=>formatCurrency(v.price),width:v=>`${v.width}mm`,height:v=>`${v.height}mm`,length:v=>`${v.length}mm`,weight:v=>`${v.grams}g`,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,type:v=>v.type,sku:v=>v.sku,price:v=>formatCurrency(v.price),width:v=>v.width,height:v=>v.height,length:v=>v.length,grams:v=>v.grams,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:product_variants.json")
    req = req.ids(ids)
    if (opts.productId !== undefined) req = req.product_id(opts.productId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Product Variants.\n\nhttps://docs.lana.dev/commerce/mutation/productVariantsDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:product_variants.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Product Variants.\n\nhttps://docs.lana.dev/commerce/mutation/productVariantsCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sku <string>", "(required) A unique identifier for the product variant in the shop (stock keeping unit).")
  .option("--attachment-id <string>", "Attachment file ID.")
  .option("--barcode <string>", "The barcode, UPC or ISBN number for the product.")
  .option("--bundle-line-items <json>", "Items in the bundle.", { value: v => JSON.parse(v) })
  .option("--cost-price <number:number>", "The cost price of the product variant.")
  .option("--country-of-origin <string>", "Country of origin (ISO 3166-1 alpha-2).")
  .option("--currency-prices <json>", "List of prices specific to currencies.", { value: v => JSON.parse(v) })
  .option("--custom-fields <json>", "", { value: v => JSON.parse(v) })
  .option("--customer-group-prices <json>", "List of prices specific to customer groups.", { value: v => JSON.parse(v) })
  .option("--discountable <boolean:boolean>", "Whether discount can be applied to this variant or not.")
  .option("--expiration-days <number:number>", "Amount of days the product is available for download after purchase (digital product), 0 if not limited.")
  .option("--fulfillment-service <enum>", "Service who is doing the fulfillment.")
  .option("--grams <number:number>", "The weight of the product variant in grams.")
  .option("--height <number:number>", "Height of the product (in millimeters) used which can be used when calculating shipping costs.")
  .option("--hs-code <string>", "Harmonized System (HS) Code.")
  .option("--inventory-management <enum>", "Specifies whether or not system tracks the number of items in stock for this product variant.")
  .option("--inventory-policy <enum>", "Specifies whether or not customers are allowed to place an order for a product variant when it's out of stock.")
  .option("--is-default <boolean:boolean>", "Whether this variant is a default variant of a product.")
  .option("--length <number:number>", "Length of the product (in millimeters) used which can be used when calculating shipping costs.")
  .option("--map-price <number:number>", "The minimum advertised price of the product variant.")
  .option("--max-downloads <number:number>", "Maximum number of downloads (digital product), 0 if not limited.")
  .option("--media-files <json>", "Media files for this variant.", { value: v => JSON.parse(v) })
  .option("--options <json>", "List of options.", { value: v => JSON.parse(v) })
  .option("--position <number:number>", "The order of the product variant in the list of product variants.")
  .option("--price <number:number>", "The price of the product variant.")
  .option("--product-id <string>", "A unique product identifier.")
  .option("--retail-price <number:number>", "The retail cost of the product variant.")
  .option("--sale-price <number:number>", "Special price for a product that can be active during a selected period of time.")
  .option("--sale-price-from <datetime>", "Lower date boundary when sale price is active.")
  .option("--sale-price-to <datetime>", "Upper date boundary when sale price is active.")
  .option("--suppliers <json>", "List of suppliers for this variant.", { value: v => JSON.parse(v) })
  .option("--tax-class <string>", "Tax class of this variant.")
  .option("--taxable <boolean:boolean>", "Specifies whether or not a tax is charged when the product variant is sold.")
  .option("--tiered-pricing <json>", "", { value: v => JSON.parse(v) })
  .option("--type <enum>", "Type of the variant.")
  .option("--width <number:number>", "Width of the product (in millimeters) used which can be used when calculating shipping costs.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:product_variants.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      sku: "sku",
      attachmentId: "attachment_id",
      barcode: "barcode",
      bundleLineItems: "bundle_line_items",
      costPrice: "cost_price",
      countryOfOrigin: "country_of_origin",
      currencyPrices: "currency_prices",
      customFields: "custom_fields",
      customerGroupPrices: "customer_group_prices",
      discountable: "discountable",
      expirationDays: "expiration_days",
      fulfillmentService: "fulfillment_service",
      grams: "grams",
      height: "height",
      hsCode: "hs_code",
      inventoryManagement: "inventory_management",
      inventoryPolicy: "inventory_policy",
      isDefault: "is_default",
      length: "length",
      mapPrice: "map_price",
      maxDownloads: "max_downloads",
      mediaFiles: "media_files",
      options: "options",
      position: "position",
      price: "price",
      productId: "product_id",
      retailPrice: "retail_price",
      salePrice: "sale_price",
      salePriceFrom: "sale_price_from",
      salePriceTo: "sale_price_to",
      suppliers: "suppliers",
      taxClass: "tax_class",
      taxable: "taxable",
      tieredPricing: "tiered_pricing",
      type: "type",
      width: "width",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Product Variants.\n\nhttps://docs.lana.dev/commerce/mutation/productVariantsModify")
  .option("--product-id <string:string>", "Unique product identifier.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--attachment-id <string>", "Attachment file ID.")
  .option("--barcode <string>", "The barcode, UPC or ISBN number for the product.")
  .option("--bundle-line-items <json>", "Items in the bundle.", { value: v => JSON.parse(v) })
  .option("--cost-price <number:number>", "The cost price of the product variant.")
  .option("--country-of-origin <string>", "Country of origin (ISO 3166-1 alpha-2).")
  .option("--currency-prices <json>", "List of prices specific to currencies.", { value: v => JSON.parse(v) })
  .option("--custom-fields <json>", "", { value: v => JSON.parse(v) })
  .option("--customer-group-prices <json>", "List of prices specific to customer groups.", { value: v => JSON.parse(v) })
  .option("--discountable <boolean:boolean>", "Whether discount can be applied to this variant or not.")
  .option("--expiration-days <number:number>", "Amount of days the product is available for download after purchase (digital product), 0 if not limited.")
  .option("--fulfillment-service <enum>", "Service who is doing the fulfillment.")
  .option("--grams <number:number>", "The weight of the product variant in grams.")
  .option("--height <number:number>", "Height of the product (in millimeters) used which can be used when calculating shipping costs.")
  .option("--hs-code <string>", "Harmonized System (HS) Code.")
  .option("--inventory-management <enum>", "Specifies whether or not system tracks the number of items in stock for this product variant.")
  .option("--inventory-policy <enum>", "Specifies whether or not customers are allowed to place an order for a product variant when it's out of stock.")
  .option("--is-default <boolean:boolean>", "Whether this variant is a default variant of a product.")
  .option("--length <number:number>", "Length of the product (in millimeters) used which can be used when calculating shipping costs.")
  .option("--map-price <number:number>", "The minimum advertised price of the product variant.")
  .option("--max-downloads <number:number>", "Maximum number of downloads (digital product), 0 if not limited.")
  .option("--media-files <json>", "Media files for this variant.", { value: v => JSON.parse(v) })
  .option("--options <json>", "List of options.", { value: v => JSON.parse(v) })
  .option("--position <number:number>", "The order of the product variant in the list of product variants.")
  .option("--price <number:number>", "The price of the product variant.")
  .option("--retail-price <number:number>", "The retail cost of the product variant.")
  .option("--sale-price <number:number>", "Special price for a product that can be active during a selected period of time.")
  .option("--sale-price-from <datetime>", "Lower date boundary when sale price is active.")
  .option("--sale-price-to <datetime>", "Upper date boundary when sale price is active.")
  .option("--sku <string>", "A unique identifier for the product variant in the shop (stock keeping unit).")
  .option("--suppliers <json>", "List of suppliers for this variant.", { value: v => JSON.parse(v) })
  .option("--tax-class <string>", "Tax class of this variant.")
  .option("--taxable <boolean:boolean>", "Specifies whether or not a tax is charged when the product variant is sold.")
  .option("--tiered-pricing <json>", "", { value: v => JSON.parse(v) })
  .option("--type <enum>", "Type of the variant.")
  .option("--width <number:number>", "Width of the product (in millimeters) used which can be used when calculating shipping costs.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:product_variants.json").ids(ids);
    if (opts.productId !== undefined) req = req.product_id(opts.productId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      attachmentId: "attachment_id",
      barcode: "barcode",
      bundleLineItems: "bundle_line_items",
      costPrice: "cost_price",
      countryOfOrigin: "country_of_origin",
      currencyPrices: "currency_prices",
      customFields: "custom_fields",
      customerGroupPrices: "customer_group_prices",
      discountable: "discountable",
      expirationDays: "expiration_days",
      fulfillmentService: "fulfillment_service",
      grams: "grams",
      height: "height",
      hsCode: "hs_code",
      inventoryManagement: "inventory_management",
      inventoryPolicy: "inventory_policy",
      isDefault: "is_default",
      length: "length",
      mapPrice: "map_price",
      maxDownloads: "max_downloads",
      mediaFiles: "media_files",
      options: "options",
      position: "position",
      price: "price",
      retailPrice: "retail_price",
      salePrice: "sale_price",
      salePriceFrom: "sale_price_from",
      salePriceTo: "sale_price_to",
      sku: "sku",
      suppliers: "suppliers",
      taxClass: "tax_class",
      taxable: "taxable",
      tieredPricing: "tiered_pricing",
      type: "type",
      width: "width",
    }));
    await req.sendUnwrap();
  })

  .command("search", "Search Product Variants.\n\nhttps://docs.lana.dev/commerce/query/searchVariants")
  .type("searchVariantsSortBy", searchVariantsSortBy)
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:searchVariantsSortBy>", "Whether to sort output in some specific way.")
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
    value: formatParser("{id:v=>v.id,type:v=>v.type,sku:v=>v.sku,price:v=>formatCurrency(v.price),width:v=>`${v.width}mm`,height:v=>`${v.height}mm`,length:v=>`${v.length}mm`,weight:v=>`${v.grams}g`,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,type:v=>v.type,sku:v=>v.sku,price:v=>formatCurrency(v.price),width:v=>v.width,height:v=>v.height,length:v=>v.length,grams:v=>v.grams,created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:search/variants.json");
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

  .reset();

export default addExtraCommands(cmd);
