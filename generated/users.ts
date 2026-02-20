
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { printValues, formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData, printIDsMaybe } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/users.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Users.")
  .action(() => {
    cmd.showHelp();
  })
  .command("list", "List Users.\n\nhttps://docs.lana.dev/commerce/query/users")
  .option("--organization-id <string:string>", "Unique organization identifier.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,email:v=>v.email,'logged in':v=>new Date(v.logged_in_at).toLocaleString(),created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,name:v=>v.name,email:v=>v.email,logged_in_at:v=>v.logged_in_at,created_at:v=>v.created_at}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:users.json")
    req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValues(resp, opts.format);
  })

  .command("get [...ids]", "Get one or multiple Users.\n\nhttps://docs.lana.dev/commerce/query/users")
  .option("--organization-id <string:string>", "Unique organization identifier.")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id:v=>v.id,name:v=>v.name,email:v=>v.email,'logged in':v=>new Date(v.logged_in_at).toLocaleString(),created:v=>new Date(v.created_at).toLocaleString()}", "{id:v=>v.id,name:v=>v.name,email:v=>v.email,logged_in_at:v=>v.logged_in_at,created_at:v=>v.created_at}"),
  })
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:users.json")
    req = req.ids(ids)
    req = req.organization_id(opts.organizationId || getConfigValue("organization_id"))
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    if (ids.length === 1) { printValue(resp[0], opts.format); } else { printValues(resp, opts.format); }
  })


  .command("create", "Create one or multiple Users.\n\nhttps://docs.lana.dev/commerce/mutation/usersCreate")
  .option("--tos-agree <boolean:boolean>", "(required) It has to be set to true and signifies that you agree with Lana TOS.")
  .option("--bio-raw-content <string>", "Raw content with user's bio.")
  .option("--display-name <string>", "Display name of the user (customers will see it).")
  .option("--email <string>", "Email of the user.")
  .option("--emails <json>", "", { value: v => JSON.parse(v) })
  .option("--language <string>", "Preferred language of the user.")
  .option("--name <string>", "Name of the user.")
  .option("--oauth-code <string>", "OAuth2 authorization code provided by the provider.")
  .option("--oauth-provider <enum>", "OAuth2 provider used for registering this account (deprecated, use oauth_providers instead).")
  .option("--password <string>", "The user's password.")
  .option("--prefer-twenty-four-hour <enum>", "Whether to use 24h time format.")
  .option("--timezone <string>", "Name of the time zone the user is in.")
  .option("--timezone-hint <string>", "Timezone hint. When provided it overrides timezone field, but only if it's correct. If it's incorrect, the value is ignored.")
  .option("--webauthn-credential <string>", "JSON-encoded PublicKeyCredential.")
  .option("--webauthn-session-id <string>", "Session ID associated with webauthn login process.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "POST:users.json");
    req = req.data(assembleInputData(opts, true, {
      tosAgree: "tos_agree",
      bioRawContent: "bio_raw_content",
      displayName: "display_name",
      email: "email",
      emails: "emails",
      language: "language",
      name: "name",
      oauthCode: "oauth_code",
      oauthProvider: "oauth_provider",
      password: "password",
      preferTwentyFourHour: "prefer_twenty_four_hour",
      timezone: "timezone",
      timezoneHint: "timezone_hint",
      webauthnCredential: "webauthn_credential",
      webauthnSessionId: "webauthn_session_id",
    }));
    printIDsMaybe(await req.sendUnwrap());
  })

  .command("modify <ids...>", "Modify one or multiple Users.\n\nhttps://docs.lana.dev/commerce/mutation/usersModify")
  .option("--bio-raw-content <string>", "Raw content with user's bio.")
  .option("--default-shop-id <string>", "Default shop identifier.")
  .option("--display-name <string>", "Display name of the user (customers will see it).")
  .option("--emails <json>", "", { value: v => JSON.parse(v) })
  .option("--language <string>", "Preferred language of the user.")
  .option("--name <string>", "Name of the user.")
  .option("--prefer-twenty-four-hour <enum>", "Whether to use 24h time format.")
  .option("--profile-image <enum>", "Which profile image should be used.")
  .option("--profile-image-color <number:number>", "Preferred color for auto profile image.")
  .option("--timezone <string>", "Name of the time zone the user is in.")
  .option("--tos-agree <boolean:boolean>", "It has to be set to true and signifies that you agree with updated Lana TOS.")
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts, ...ids) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "POST:users.json").ids(ids);
    req = req.data(assembleInputData(opts, true, {
      bioRawContent: "bio_raw_content",
      defaultShopId: "default_shop_id",
      displayName: "display_name",
      emails: "emails",
      language: "language",
      name: "name",
      preferTwentyFourHour: "prefer_twenty_four_hour",
      profileImage: "profile_image",
      profileImageColor: "profile_image_color",
      timezone: "timezone",
      tosAgree: "tos_agree",
    }));
    await req.sendUnwrap();
  })


  .reset();

export default addExtraCommands(cmd);
