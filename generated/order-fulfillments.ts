
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"

const fulfillmentType = new EnumType(["digital_good", "gift_card", "physical"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/order-fulfillments.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Order Fulfillments.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Order Fulfillments.\n\nhttps://docs.lana.dev/commerce/query/orderFulfillments")
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,'tracking company':v=>v.tracking_company,'tracking number':v=>v.tracking_number,'tracking url':v=>v.tracking_url,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,tracking_company:v=>v.tracking_company,tracking_number:v=>v.tracking_number,tracking_url:v=>v.tracking_url,created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:order_fulfillments.json")
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Order Fulfillments.\n\nhttps://docs.lana.dev/commerce/query/orderFulfillments")
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,'tracking company':v=>v.tracking_company,'tracking number':v=>v.tracking_number,'tracking url':v=>v.tracking_url,created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,tracking_company:v=>v.tracking_company,tracking_number:v=>v.tracking_number,tracking_url:v=>v.tracking_url,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:order_fulfillments.json")
    req = req.ids(ids)
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })


  .command("create", "Create one or multiple Order Fulfillments.\n\nhttps://docs.lana.dev/commerce/mutation/orderFulfillmentsCreate")
  .type("fulfillmentType", fulfillmentType)
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--type <enum:fulfillmentType>", "When automatically creating a fulfillment, use only items from given category.")
  .option("--email <boolean:boolean>", "Whether to notify customer about fulfillment creation or not.")
  .option("--line-items <json>", "Array of line items associated with the fulfillment.", { value: v => JSON.parse(v) })
  .option("--pickup-inventory-location-id <string>", "Destination pickup inventory location.")
  .option("--scheduled-fulfillment-id <string>", "Scheduled fulfillment to use when creating this fulfillment. Requires scheduled_fulfillment_line_items.")
  .option("--scheduled-fulfillment-line-items <json>", "Specifies where to allocate unreserved items at.", { value: v => JSON.parse(v) })
  .option("--shipping-provider-type <enum>", "Type of the shipping provider.")
  .option("--subscription-id <string>", "This fulfullment is associated with the given subscription.")
  .option("--tracking-company <string>", "The name of the shipping company.")
  .option("--tracking-number <string>", "Shipping number, provided by the shipping company.")
  .option("--tracking-url <string>", "The URLs to track the fulfillment.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:order_fulfillments.json");
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.type !== undefined) req = req.type(opts.type)
    req = req.data(assembleInputData(opts, true, {
      email: "email",
      lineItems: "line_items",
      pickupInventoryLocationId: "pickup_inventory_location_id",
      scheduledFulfillmentId: "scheduled_fulfillment_id",
      scheduledFulfillmentLineItems: "scheduled_fulfillment_line_items",
      shippingProviderType: "shipping_provider_type",
      subscriptionId: "subscription_id",
      trackingCompany: "tracking_company",
      trackingNumber: "tracking_number",
      trackingUrl: "tracking_url",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Order Fulfillments.\n\nhttps://docs.lana.dev/commerce/mutation/orderFulfillmentsModify")
  .type("fulfillmentType", fulfillmentType)
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--type <enum:fulfillmentType>", "When automatically creating a fulfillment, use only items from given category.")
  .option("--email <boolean:boolean>", "Whether to notify customer about fulfillment creation or not.")
  .option("--pickup-inventory-location-id <string>", "Destination pickup inventory location.")
  .option("--shipping-provider-type <enum>", "Type of the shipping provider.")
  .option("--tracking-company <string>", "The name of the shipping company.")
  .option("--tracking-number <string>", "Shipping number, provided by the shipping company.")
  .option("--tracking-url <string>", "The URLs to track the fulfillment.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:order_fulfillments.json").ids(ids);
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    if (opts.type !== undefined) req = req.type(opts.type)
    req = req.data(assembleInputData(opts, true, {
      email: "email",
      pickupInventoryLocationId: "pickup_inventory_location_id",
      shippingProviderType: "shipping_provider_type",
      trackingCompany: "tracking_company",
      trackingNumber: "tracking_number",
      trackingUrl: "tracking_url",
    }));
    await req.sendUnwrap();
  })

  .command("cancel", "Cancel Order Fulfillment.\n\nhttps://docs.lana.dev/commerce/mutation/orderFulfillmentsCancel")
  .option("--fulfillment-id <string:string>", "Unique order fulfillment identifier.", { required: true })
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:order_fulfillments/cancel.json");
    if (opts.fulfillmentId !== undefined) req = req.fulfillment_id(opts.fulfillmentId)
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("complete", "Complete Order Fulfillment.\n\nhttps://docs.lana.dev/commerce/mutation/orderFulfillmentsComplete")
  .option("--fulfillment-id <string:string>", "Unique order fulfillment identifier.", { required: true })
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:order_fulfillments/complete.json");
    if (opts.fulfillmentId !== undefined) req = req.fulfillment_id(opts.fulfillmentId)
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("events", "Submit Order Fulfillment events.\n\nhttps://docs.lana.dev/commerce/mutation/orderFulfillmentsEventsCreate")
  .option("--fulfillment-id <string:string>", "Unique order fulfillment identifier.", { required: true })
  .option("--order-id <string:string>", "Unique order identifier.", { required: true })
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--city <string>", "City of the event (comes from shipping provider).")
  .option("--code <string>", "Shipping provider-specific code of the event.")
  .option("--country <string>", "Country code of the event (comes from shipping provider).")
  .option("--description <string>", "Free form description of the event.")
  .option("--province <string>", "Province code of the event (comes from shipping provider).")
  .option("--status <enum>", "Event status.")
  .option("--zip <string>", "Zip or postal code of the event (comes from shipping provider).")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:order_fulfillments/events.json");
    if (opts.fulfillmentId !== undefined) req = req.fulfillment_id(opts.fulfillmentId)
    if (opts.orderId !== undefined) req = req.order_id(opts.orderId)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      city: "city",
      code: "code",
      country: "country",
      description: "description",
      province: "province",
      status: "status",
      zip: "zip",
    }));
    await req.sendUnwrap();
  })

  .reset();

export default addExtraCommands(cmd);
