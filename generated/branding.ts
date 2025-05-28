
import { Command } from "@cliffy/command"
import { getRequestContext, getConfigValue } from "../lib/config.ts"
import { request } from "@lana-commerce/core/json/commerce"
import { formatParser, printValue } from "../lib/format.ts"
import { updateAllCacheEntries } from "../lib/cache.ts"
import { assembleInputData } from "../lib/inputData.ts"



let addExtraCommands = (cmd: Command) => cmd;
try {
  const m = await import("../extra/branding.ts");
  addExtraCommands = m.addExtraCommands;
} catch {
  // do nothing
}

const cmd = new Command()
  .description("Manage Branding.")
  .action(() => {
    cmd.showHelp();
  })

  .command("get", "Get Branding.\n\nhttps://docs.lana.dev/commerce/query/branding")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id: v=>v.fields.map(v=>v.id),description: v=>v.fields.map(v=>v.description),type: v=>v.fields.map(v=>v.type),value: v=>v.fields.map(v=>{\n      if (v.type === \"image_file\") {\n        return v.image_file?.id || \"\";\n      } else if (v.type === \"string\") {\n        return v.string;\n      } else if (v.type === \"link\") {\n        return v.link;\n      } else if (v.type === \"color\") {\n        return v.color;\n      } else if (v.type === \"boolean\") {\n        return v.boolean;\n      } else if (v.type === \"radio\") {\n        return v.radio;\n      } else if (v.type === \"font\") {\n        return v.font;\n      } else if (v.type === \"text\") {\n        return v.text;\n      } else {\n        return \"\";\n      }\n    }).map(v => JSON.stringify(`${v}`))}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "GET:branding.json")
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    const resp = await req.sendUnwrap();
    printValue(resp, opts.format);
  })



  .command("modify", "Modify Branding.\n\nhttps://docs.lana.dev/commerce/mutation/brandingCreate")
  .option("--shop-id <string:string>", "Unique shop identifier.")
  .option("--fields <json>", "(required).", { value: v => JSON.parse(v) })
  .option("--data <data>", "Input JSON data file or \"-\" for stdin")
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, opts.shopId || getConfigValue("shop_id"));
    let req = request(ctx, "POST:branding.json");
    req = req.shop_id(opts.shopId || getConfigValue("shop_id"))
    req = req.data(assembleInputData(opts, false, {
      fields: "fields",
    }));
    await req.sendUnwrap();
  })

  .command("default", "Get default Branding.\n\nhttps://docs.lana.dev/commerce/query/brandingDefault")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser("{id: v=>v.fields.map(v=>v.id),description: v=>v.fields.map(v=>v.description),type: v=>v.fields.map(v=>v.type),value: v=>v.fields.map(v=>{\n      if (v.type === \"image_file\") {\n        return v.image_file?.id || \"\";\n      } else if (v.type === \"string\") {\n        return v.string;\n      } else if (v.type === \"link\") {\n        return v.link;\n      } else if (v.type === \"color\") {\n        return v.color;\n      } else if (v.type === \"boolean\") {\n        return v.boolean;\n      } else if (v.type === \"radio\") {\n        return v.radio;\n      } else if (v.type === \"font\") {\n        return v.font;\n      } else if (v.type === \"text\") {\n        return v.text;\n      } else {\n        return \"\";\n      }\n    }).map(v => JSON.stringify(`${v}`))}"),
  })
  .action(async (opts) => {
    const ctx = getRequestContext();
    await updateAllCacheEntries(ctx, "");
    let req = request(ctx, "GET:branding/default.json");
    const resp = await req.sendUnwrap();
    printValue(resp, opts.format);
  })

  .reset();

export default addExtraCommands(cmd);
