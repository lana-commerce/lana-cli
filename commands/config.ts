import { Command } from "@cliffy/command";
import { colors } from "@cliffy/ansi/colors";
import { getConfigEntries, getConfigInfo, getRequestContext, setConfigValue, unsetConfigValue } from "../lib/config.ts";
import fuzzySort from "fuzzysort";
import { nonNull } from "../lib/nonNull.ts";
import { promptSecret } from "@std/cli/prompt-secret";
import { request } from "@lana-commerce/core/json/commerce";
import { decodeBase64 } from "@std/encoding/base64";
import { formatParser, FormatSpecInput, printValues } from "../lib/format.ts";
import { noop } from "../lib/noop.ts";

const tableSpec: FormatSpecInput = {
  name: (v) => v.name,
  value: (v) => (v.value !== v.defaultValue ? colors.bold : noop)(JSON.stringify(v.value)),
  description: (v) => colors.gray(v.description),
  _name: 50,
  _value: 50,
  _description: "100%",
  _vspacing: 1,
};

const csvSpec: FormatSpecInput = {
  name: (v) => v.name,
  value: (v) => v.value,
  defaultValue: (v) => v.defaultValue,
  description: (v) => v.description,
};

const cmd = new Command()
  .action(() => {
    cmd.showHelp();
  })
  .command("location", "Show config file location.")
  .action(() => {
    const info = getConfigInfo();
    console.log(info.configFile);
  })
  .command("get <name>", "Get a specific config value.")
  .option("--json", "Format the value as JSON.")
  .option("--no-newline", "Do not write the newline after the value.")
  .action(({ newline, json }, name) => {
    const entries = getConfigEntries();
    const e = entries.find((e) => e.name === name);
    if (!e) {
      console.error(`unknown config entry name: ${JSON.stringify(name)}`);
      Deno.exitCode = 1;
    } else {
      const v = json ? (e.toJSON ?? JSON.stringify)(e.value) : e.value;
      Deno.stdout.writeSync(new TextEncoder().encode(`${v}${newline ? "\n" : ""}`));
    }
  })
  .command("set <name> <value>", "Set a specific config value.")
  .action((_opts, name, value) => {
    setConfigValue(name, value);
  })
  .command("unset <name>", "Reset a specific config value to its default.")
  .action((_opts, name) => {
    unsetConfigValue(name);
  })
  .command("list [search]", "List all or some of the config values.")
  .option("--format <format>", "Format the output in a specific way.", {
    default: "table",
    value: formatParser(tableSpec, csvSpec),
  })
  .action(({ format }, search) => {
    const hlName = new Map<string, string>();
    const entries = getConfigEntries();
    const entriesMap = new Map(entries.map((e) => [e.name, e]));
    if (search) {
      const names = entries.map((e) => e.name);
      const result = fuzzySort.go(search, names);
      entries.length = 0;
      entries.push(...result.map((r) => entriesMap.get(r.target)).filter(nonNull));
      for (const r of result) {
        hlName.set(r.target, r.highlight(colors.bold).join(""));
      }
    }

    const data = entries.map((e) => ({
      name: e.name,
      value: e.value,
      defaultValue: e.defaultValue,
      description: e.description,
    }));
    if (format.type === "table") {
      // for table format we also produce some coloring on values
      data.forEach((e) => {
        e.name = hlName.get(e.name) || e.name;
      });
    }
    printValues(data, format);
  })
  .command("login", "Login to Lana API. (interactive)")
  .action(async () => {
    const ctx = getRequestContext();
    delete ctx["token"];
    const email = prompt("Email:");
    const password = promptSecret("Password:");
    const resp = await request(ctx, "POST:auth/login.json")
      .data({ email, password })
      .extract({
        token: (v) => v.token,
        userID: (v) => v.user_id,
      })
      .sendUnwrap();
    const jwt = resp.token;
    const payload = jwt.split(".")[1];
    const json = JSON.parse(new TextDecoder().decode(decodeBase64(payload)));
    setConfigValue("jwt", jwt);
    console.log(`Login successful! JWT is saved to the config file.`);
    console.log(`JWT read permission expires at: ${new Date(json.exp * 1000)}`);
    console.log(`JWT write permission expires at: ${new Date(json.wexp * 1000)}`);
    const [r1, r2] = await Promise.all([
      request(ctx, "GET:shops/page.json").sendUnwrap(),
      request(ctx, "GET:users.json").ids([ctx.userID]).sendUnwrap(),
    ]);
    if (r2.length > 0 && r2[0].default_shop_id) {
      console.log(`Shop ID is set to: ${r2[0].default_shop_id} (default user shop)`);
      setConfigValue("shop_id", r2[0].default_shop_id);
    } else if (r1.items.length === 1) {
      console.log(`Shop ID is set to: ${r1.items[0].id} (the only shop)`);
      setConfigValue("shop_id", r1.items[0].id);
    }
  })
  .reset();

export default cmd;
