import xdg from "xdg_portable";
import * as path from "@std/path";
import * as vb from "@valibot/valibot";

const configDir = path.join(xdg.config(), "lana-cli");
const configFile = path.join(configDir, "config.json");

const FormatType = vb.picklist(["table", "json"]);
type Format = vb.InferOutput<typeof FormatType>;

//------------------------------------------------------------------------------------------------

export interface ConfigEntry<T> {
  name: string;
  value: T;
  description: string;
  defaultValue: T;
  toJSON?(v: T): any;
  fromText?(v: string): T;
  fromJSON(v: any): T;
}

function configEntry<T>(v: Omit<ConfigEntry<T>, "value" | "name">): ConfigEntry<T> {
  return { ...v, name: "", value: v.defaultValue };
}

const jsonString = {
  fromJSON(v: any): string {
    return vb.parse(vb.string(), v);
  },
};

const entries = {
  "jwt": configEntry({
    description:
      "The JSON Web Token (JWT) for authenticating API calls. You usually won't need to set this manually — just use the `config login` command, and it'll handle everything for you.",
    defaultValue: "",
    ...jsonString,
  }),
  "api_key": configEntry({
    description:
      "Your API key for making API calls. This is the recommended way to authenticate with the CLI tool. If provided, it takes priority over the 'jwt' option.",
    defaultValue: "",
    ...jsonString,
  }),
  "shop_id": configEntry({
    description:
      "Many API calls need a shop ID. If you frequently work with the same shop, set this once, and it'll automatically apply to API requests — saving you time and effort!",
    defaultValue: "",
    ...jsonString,
  }),
  "api": configEntry({
    description:
      "The domain used to determine API endpoints. It's primarily for internal access to test environments. Unless you have a specific need, the default value should work perfectly for you!",
    defaultValue: "lana.dev",
    ...jsonString,
  }),
  "format": configEntry<Format>({
    description: "Default format to use when formatting output.",
    defaultValue: "table",
    fromJSON: (v) => vb.parse(FormatType, v),
  }),
};

const entryKeys = Object.keys(entries).sort() as (keyof typeof entries)[];

for (const key of entryKeys) {
  const e = entries[key];
  e.name = key;
}

//------------------------------------------------------------------------------------------------

let configLoaded = false;
function ensureConfigLoaded() {
  if (configLoaded) return;
  configLoaded = true;
  try {
    const data = Deno.readTextFileSync(configFile);
    const json = JSON.parse(data);
    for (const key of entryKeys) {
      const e = entries[key];
      e.value = e.fromJSON(json[key]);
    }
  } catch {
    // do nothing
  }
}

function saveConfig() {
  const cfg: Record<string, any> = {};
  for (const key of entryKeys) {
    const e: ConfigEntry<any> = entries[key];
    cfg[key] = e.toJSON ? e.toJSON(e.value) : e.value;
  }
  Deno.mkdirSync(configDir, { recursive: true });
  Deno.writeTextFileSync(configFile, JSON.stringify(cfg, null, 2));
}

export function getConfigEntries(): ConfigEntry<any>[] {
  ensureConfigLoaded();
  return entryKeys.map((k) => entries[k]);
}

export function setConfigValue(name: string, value: string) {
  ensureConfigLoaded();
  const key = entryKeys.find((k) => k === name);
  if (!key) {
    console.error(`unknown config entry name: ${JSON.stringify(name)}`);
    Deno.exitCode = 1;
    return;
  }
  const e = entries[key];
  try {
    e.value = (e.fromText ?? e.fromJSON)(value);
  } catch (err: any) {
    console.error(err.toString());
    Deno.exitCode = 1;
    return;
  }

  saveConfig();
}

export function getConfigValue<K extends keyof typeof entries>(name: K): (typeof entries)[K]["value"] {
  ensureConfigLoaded();
  return entries[name].value;
}
