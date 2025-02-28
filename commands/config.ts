import { Command, EnumType } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { colors } from "@cliffy/ansi/colors";
import { getConfigEntries, getConfigValue, setConfigValue } from "../lib/config.ts";
import fuzzySort from "fuzzysort";
import { nonNull } from "../lib/nonNull.ts";

const formatType = new EnumType(["table", "json"]);

const cmd = new Command()
  .action(() => {
    cmd.showHelp();
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
    if (format === "table") {
      const w = Deno.consoleSize().columns - 2 - 2; // available width
      const t = new Table<[string, string, string]>()
        .header(["NAME", "VALUE", "DESCRIPTION"].map(colors.bold))
        .padding(2)
        .body(entries.map((e) => {
          const value = e.value;
          const defaultValue = e.defaultValue;
          const description = e.description;
          let valueStr = JSON.stringify(value);
          if (value !== defaultValue) {
            valueStr = colors.bold(valueStr);
          }
          const name = hlName.get(e.name) || e.name;
          return [name, valueStr, colors.gray(description)];
        }));
      let maxK = 0;
      let maxV = 0;
      for (const row of t) {
        const [k, v] = row;
        maxK = Math.max(maxK, k.length);
        maxV = Math.max(maxV, v.length);
      }
      t
        .columns([
          {},
          {},
          { maxWidth: w - maxK - maxV },
        ])
        .render();
    } else if (format === "json") {
      console.log(
        JSON.stringify(
          entries.map((e) => ({
            name: e.name,
            value: e.value,
            defaultValue: e.defaultValue,
            description: e.description,
          })),
          null,
          2,
        ),
      );
    }
  })
  .command("login", "Login to API.")
  .action(() => {
    console.log("not implemented yet");
  })
  .reset();

export default cmd;
