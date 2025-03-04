import { Command, EnumType } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { colors } from "@cliffy/ansi/colors";
import {
  getConfigEntries,
  getConfigInfo,
  getConfigValue,
  getRequestContext,
  setConfigValue,
  unsetConfigValue,
} from "../lib/config.ts";
import fuzzySort from "fuzzysort";
import { nonNull } from "../lib/nonNull.ts";
import { FormatType } from "../lib/format.ts";
import { promptSecret } from "@std/cli/prompt-secret";
import { stringify as csvStringify } from "@std/csv";
import { request } from "@lana-commerce/core/json/commerce";
import { decodeBase64 } from "@std/encoding/base64";

const formatType = new EnumType(FormatType.options);

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
  .type("format", formatType)
  .option("--format <format:format>", "Format the output in a specific way.")
  .action(({ format }, search) => {
    format = format ?? getConfigValue("format");
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

    if (format === "table") {
      const header = ["NAME", "VALUE", "DESCRIPTION"];
      const t = new Table<[string, string, string]>()
        .header(header.map(colors.bold))
        .padding(2)
        .body(data.map((e) => {
          const value = e.value;
          const defaultValue = e.defaultValue;
          const description = e.description;
          let valueStr = JSON.stringify(value);
          if (value !== defaultValue) {
            valueStr = colors.bold(valueStr);
          }
          const name = hlName.get(e.name) || e.name;
          return ["\n" + name, "\n" + valueStr, "\n" + colors.gray(description)];
        }));
      let maxK = 0;
      let maxV = 0;

      const w = Deno.consoleSize().columns - (header.length - 1) * 2; // available width
      for (const row of t) {
        const [k, v] = row;
        maxK = Math.min(50, Math.max(maxK, k.length));
        maxV = Math.min(50, Math.max(maxV, v.length));
      }
      t
        .columns(
          header.map((_, i) => i === header.length - 1 ? { maxWidth: Math.max(1, w - maxK - maxV) } : { maxWidth: 50 }),
        )
        .render();
    } else if (format === "json") {
      console.log(
        JSON.stringify(
          data,
          null,
          2,
        ),
      );
    } else if (format === "csv") {
      const output = csvStringify(data, { columns: ["name", "value", "defaultValue", "description"] });
      Deno.stdout.writeSync(new TextEncoder().encode(output));
    }
  })
  .command("login", "Login to Lana API. (interactive)")
  .action(async () => {
    const { token, ...ctx } = getRequestContext();
    const email = prompt("Email:");
    const password = promptSecret("Password:");
    const resp = await request(ctx, "POST:auth/login.json").data({ email, password }).sendUnwrap();
    const jwt = resp.token;
    const payload = jwt.split(".")[1];
    const json = JSON.parse(new TextDecoder().decode(decodeBase64(payload)));
    console.log(`Login successful! JWT will be saved in the config file.`);
    console.log(`JWT read permission expires at: ${new Date(json.exp * 1000)}`);
    console.log(`JWT write permission expires at: ${new Date(json.wexp * 1000)}`);
    setConfigValue("jwt", jwt);
  })
  .reset();

export default cmd;
