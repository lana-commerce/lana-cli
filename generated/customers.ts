
import { Command, EnumType } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, streamValues, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"
import { waitForTaskWithProgressBar } from "../lib/task.ts"
import { downloadFileToFile, uploadFileToFile } from "../lib/file.ts"

const customerCategory = new EnumType(["accepts_marketing", "any", "repeat_customer"]);
const customersPageSortBy = new EnumType(["created_at", "updated_at"]);
const searchCustomersSortBy = new EnumType(["created_at", "email", "last_order", "name", "order_count", "total_spent", "updated_at"]);

let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/customers.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Customers.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Customers.\n\nhttps://docs.lana.dev/commerce/query/customersPage")
  .type("customerCategory", customerCategory)
  .type("customersPageSortBy", customersPageSortBy)
  .option("--created-at-max <datetime:string>", "Filter output by creation date, upper boundary.")
  .option("--created-at-min <datetime:string>", "Filter output by creation date, lower boundary.")
  .option("--customer-group-id <string:string>", "Show only customers from a certain customer group.")
  .option("--deleted", "Include deleted items into result where applicable.")
  .option("--last-key <string:string>", "Key of the last item from previous page.")
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:customersPageSortBy>", "Whether to sort output in some specific way.")
  .option("--sort-desc", "Whether to use descending sort order.")
  .option("--type <enum:customerCategory>", "Filter customers output by a customer type.")
  .option("--updated-at-max <datetime:string>", "Filter output by last update date, upper boundary.")
  .option("--updated-at-min <datetime:string>", "Filter output by last update date, lower boundary.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,email:v=>v.email,'tax exempt':v=>v.tax_exempt?'Yes':'No',created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,name:v=>v.name,email:v=>v.email,tax_exempt:v=>v.tax_exempt,created_at:v=>v.created_at}"),
  })
  .option("--stream", "Stream paginated output instead of returning a single page.")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:customers/page.json")
    if (opts.stream) {
      if (opts.createdAtMax !== undefined) req = req.created_at_max(opts.createdAtMax)
      if (opts.createdAtMin !== undefined) req = req.created_at_min(opts.createdAtMin)
      if (opts.customerGroupId !== undefined) req = req.customer_group_id(opts.customerGroupId)
      if (opts.deleted) req = req.deleted(true)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.type !== undefined) req = req.type(opts.type)
      if (opts.updatedAtMax !== undefined) req = req.updated_at_max(opts.updatedAtMax)
      if (opts.updatedAtMin !== undefined) req = req.updated_at_min(opts.updatedAtMin)
      await streamValues(req, opts.format, opts.sortBy);
    } else {
      if (opts.createdAtMax !== undefined) req = req.created_at_max(opts.createdAtMax)
      if (opts.createdAtMin !== undefined) req = req.created_at_min(opts.createdAtMin)
      if (opts.customerGroupId !== undefined) req = req.customer_group_id(opts.customerGroupId)
      if (opts.deleted) req = req.deleted(true)
      if (opts.lastKey !== undefined) req = req.last_key(opts.lastKey)
      if (opts.limit !== undefined) req = req.limit(opts.limit)
      if (opts.offset !== undefined) req = req.offset(opts.offset)
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
      if (opts.sortBy !== undefined) req = req.sort_by(opts.sortBy)
      if (opts.sortDesc) req = req.sort_desc(true)
      if (opts.type !== undefined) req = req.type(opts.type)
      if (opts.updatedAtMax !== undefined) req = req.updated_at_max(opts.updatedAtMax)
      if (opts.updatedAtMin !== undefined) req = req.updated_at_min(opts.updatedAtMin)
      const resp = await req.sendUnwrap();
      printValues(resp.items, opts.format);
    }
  })

  .command("get [...ids]", "Get one or multiple Customers.\n\nhttps://docs.lana.dev/commerce/query/customers")
  .option("--deleted", "Include deleted items into result where applicable.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,email:v=>v.email,'tax exempt':v=>v.tax_exempt?'Yes':'No',created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,name:v=>v.name,email:v=>v.email,tax_exempt:v=>v.tax_exempt,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:customers.json")
    req = req.ids(ids)
    if (opts.deleted) req = req.deleted(true)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })

  .command("delete <...ids>", "Delete one or multiple Customers.\n\nhttps://docs.lana.dev/commerce/mutation/customersDelete")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "DELETE:customers.json")
    req = req.ids(ids)
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    await req.sendUnwrap();
  })

  .command("create", "Create one or multiple Customers.\n\nhttps://docs.lana.dev/commerce/mutation/customersCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--email <string>", "(required) The email address of the customer.")
  .option("--accepts-marketing <boolean:boolean>", "Indicates whether the customer has consented to be sent marketing material via email.")
  .option("--addresses <json>", "", { value: v => JSON.parse(v) })
  .option("--customer-group-id <string>", "Customer group id, can only be set by shop admins.")
  .option("--default-billing-address-id <string>", "Default billing address identifier.")
  .option("--default-shipping-address-id <string>", "Default shipping address identifier.")
  .option("--display-name <string>", "The name to display for other customers (under product reviews and such).")
  .option("--email-confirmed <boolean:boolean>", "Whether customer's email address was confirmed or not.")
  .option("--import-id <string>", "If customer is created as a result of import process, this is import process owner ID.")
  .option("--import-index <number:number>", "If customer is created as a result of import process, this is import index (e.g. CSV line).")
  .option("--is-disposable-email <boolean:boolean>", "Whether or not customer's email address looks suspicious (fraud).")
  .option("--language <string>", "Preferred language of the customer.")
  .option("--metadata <json>", "", { value: v => JSON.parse(v) })
  .option("--mobile <string>", "The mobile phone number of the customer (used for notifications).")
  .option("--mobile-notifications <boolean:boolean>", "Whether to notify customer via mobile phone or not.")
  .option("--name <string>", "Name of the customer.")
  .option("--password <string>", "The customer's password.")
  .option("--preferred-currency <string>", "Currency customer prefers.")
  .option("--reminder-messages <boolean:boolean>", "Indicates whether the customer desires to get reminder emails.")
  .option("--tags <json>", "Customer tags (can be used for organization).", { value: v => JSON.parse(v) })
  .option("--tax-exempt <boolean:boolean>", "Marks customer as tax-exempt, customer will not be charged any taxes.")
  .option("--timezone <string>", "Name of the time zone the customer is in.")
  .option("--timezone-hint <string>", "Timezone hint. When provided it overrides timezone field, but only if it's correct. If it's incorrect, the value is ignored.")
  .option("--webauthn-credential <string>", "JSON-encoded PublicKeyCredential.")
  .option("--webauthn-session-id <string>", "Session ID associated with webauthn login process.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:customers.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      email: "email",
      acceptsMarketing: "accepts_marketing",
      addresses: "addresses",
      customerGroupId: "customer_group_id",
      defaultBillingAddressId: "default_billing_address_id",
      defaultShippingAddressId: "default_shipping_address_id",
      displayName: "display_name",
      emailConfirmed: "email_confirmed",
      importId: "import_id",
      importIndex: "import_index",
      isDisposableEmail: "is_disposable_email",
      language: "language",
      metadata: "metadata",
      mobile: "mobile",
      mobileNotifications: "mobile_notifications",
      name: "name",
      password: "password",
      preferredCurrency: "preferred_currency",
      reminderMessages: "reminder_messages",
      tags: "tags",
      taxExempt: "tax_exempt",
      timezone: "timezone",
      timezoneHint: "timezone_hint",
      webauthnCredential: "webauthn_credential",
      webauthnSessionId: "webauthn_session_id",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Customers.\n\nhttps://docs.lana.dev/commerce/mutation/customersModify")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--accepts-marketing <boolean:boolean>", "Indicates whether the customer has consented to be sent marketing material via email.")
  .option("--addresses <json>", "", { value: v => JSON.parse(v) })
  .option("--customer-group-id <string>", "Customer group id, can only be set by shop admins.")
  .option("--default-billing-address-id <string>", "Default billing address index.")
  .option("--default-payment-source-id <string>", "Default stripe payment source id.")
  .option("--default-shipping-address-id <string>", "Default shipping address index.")
  .option("--display-name <string>", "The name to display for other customers (under product reviews and such).")
  .option("--email-confirmed <boolean:boolean>", "Whether customer's email address was confirmed or not.")
  .option("--is-disposable-email <boolean:boolean>", "Whether or not customer's email address looks suspicious (fraud).")
  .option("--language <string>", "Preferred language of the customer.")
  .option("--metadata <json>", "", { value: v => JSON.parse(v) })
  .option("--mobile <string>", "The mobile phone number of the customer (used for notifications).")
  .option("--mobile-notifications <boolean:boolean>", "Whether to notify customer via mobile phone or not.")
  .option("--name <string>", "Name of the customer.")
  .option("--preferred-currency <string>", "Currency customer prefers.")
  .option("--reminder-messages <boolean:boolean>", "Indicates whether the customer desires to get reminder emails.")
  .option("--tags <json>", "Customer tags (can be used for organization).", { value: v => JSON.parse(v) })
  .option("--tax-exempt <boolean:boolean>", "Marks customer as tax-exempt, customer will not be charged any taxes.")
  .option("--timezone <string>", "Name of the time zone the customer is in.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:customers.json").ids(ids);
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, true, {
      acceptsMarketing: "accepts_marketing",
      addresses: "addresses",
      customerGroupId: "customer_group_id",
      defaultBillingAddressId: "default_billing_address_id",
      defaultPaymentSourceId: "default_payment_source_id",
      defaultShippingAddressId: "default_shipping_address_id",
      displayName: "display_name",
      emailConfirmed: "email_confirmed",
      isDisposableEmail: "is_disposable_email",
      language: "language",
      metadata: "metadata",
      mobile: "mobile",
      mobileNotifications: "mobile_notifications",
      name: "name",
      preferredCurrency: "preferred_currency",
      reminderMessages: "reminder_messages",
      tags: "tags",
      taxExempt: "tax_exempt",
      timezone: "timezone",
    }));
    await req.sendUnwrap();
  })

  .command("search", "Search Customers.\n\nhttps://docs.lana.dev/commerce/query/searchCustomers")
  .type("searchCustomersSortBy", searchCustomersSortBy)
  .option("--limit <number:number>", "Return up to N entries (pagination).")
  .option("--offset <number:number>", "Skip N entries (pagination).")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--sort-by <enum:searchCustomersSortBy>", "Whether to sort output in some specific way.")
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
    value: formatParser("{id:v=>v.id,name:v=>v.name,email:v=>v.email,'tax exempt':v=>v.tax_exempt?'Yes':'No',created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,name:v=>v.name,email:v=>v.email,tax_exempt:v=>v.tax_exempt,created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:search/customers.json");
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

  .command("suggest <...query>", "Suggest Customers.\n\nhttps://docs.lana.dev/commerce/query/suggestCustomers")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,email:v=>v.email,'tax exempt':v=>v.tax_exempt?'Yes':'No',created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,name:v=>v.name,email:v=>v.email,tax_exempt:v=>v.tax_exempt,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...query) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:suggest/customers.json");
    req = req.expand({ items: true });
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data({ query: query.join(" ") });
    const resp = await req.sendUnwrap();
    printValues(resp.items, opts.format);
  })

  .command("export [output]", "Export Customers.\n\nGet info on available CSV columns using this command: `info-csv-format get --name customer`\n\nhttps://docs.lana.dev/commerce/mutation/customersExport")
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
    let req = request(ctx, "POST:customers/export.json");
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
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Exporting Customers.");
    const fileID = t?.result_file?.id;
    if (!fileID) throw new Error("file id is missing in task result");
    if (output) {
      await downloadFileToFile(ctx, shopID, fileID, output);
    } else {
      console.log(`Export result is saved to file: ${fileID}`);
    }
  })

  .command("import <input>", "Import Customers.\n\nGet info on available CSV columns using this command: `info-csv-format get --name customer`\n\nhttps://docs.lana.dev/commerce/mutation/customersImport")
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
    let req = request(ctx, "POST:customers/import.json");
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
    const t = await waitForTaskWithProgressBar(ctx, shopID, taskID, "Importing Customers.");
    if (t && t.errors.length > 0) {
      console.log("Errors:");
      for (const e of t.errors) {
        console.log(e.message);
      }
    }
  })

  .reset();

export default addExtraCommands(cmd);
