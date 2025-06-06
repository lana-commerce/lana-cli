import { Command } from "@cliffy/command";
import { request } from "@lana-commerce/core/json/commerce";
import { getConfigValue, getRequestContext } from "../lib/config.ts";
import { updateAllCacheEntries } from "../lib/cache.ts";
import { formatParser, printValue } from "../lib/format.ts";
import { decodeBase64 } from "@std/encoding/base64";

export function addExtraCommands(cmd: Command): Command {
  return cmd.command(
    "self",
    "Get current user's info (JWT-based user_id).\n\nhttps://docs.lana.dev/commerce/query/users",
  )
    .option("--shop-id <string:string>", "Unique shop identifier.")
    .option("--format <format>", "Format the output in a specific way.", {
      default: "table",
      value: formatParser(
        "{id:v=>v.id,name:v=>v.name,email:v=>v.email,'logged in':v=>new Date(v.logged_in_at).toLocaleString(),created:v=>new Date(v.created_at).toLocaleString()}",
        "{id:v=>v.id,name:v=>v.name,email:v=>v.email,logged_in_at:v=>v.logged_in_at,created_at:v=>v.created_at}",
      ),
    })
    .action(async (opts) => {
      let userID = "";
      try {
        const vals = getConfigValue("jwt").split(".");
        const v = JSON.parse(new TextDecoder().decode(decodeBase64(vals[1]))).user_id;
        if (v && typeof v === "string") {
          userID = v;
        }
      } catch {
        // do nothing
      }
      if (!userID) {
        throw new Error("unable to infer the user id");
      }

      const ctx = getRequestContext();
      await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
      let req = request(ctx, "GET:users.json");
      req = req.ids([userID]);
      req = req.shop_id(opts.shopId || getConfigValue("shop_id"));
      const resp = await req.sendUnwrap();
      printValue(resp[0], opts.format);
    })
    .reset();
}
