import xdg from "xdg_portable";
import * as path from "@std/path";
import * as vb from "@valibot/valibot";
import { existsSync } from "@std/fs";
import { decodeBase64 } from "@std/encoding/base64";
import type { Context } from "@lana-commerce/core/json/commerce";

const configDir = path.join(xdg.config(), "lana-cli");
const configFile = path.join(configDir, "config.json");

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
      "Provides the JSON Web Token (JWT) for authenticating API calls. Manual configuration is typically unnecessary; instead, use the `config login` command to automatically manage this setting.",
    defaultValue: "",
    ...jsonString,
  }),
  "shop_id": configEntry({
    description:
      "Indicates the shop ID required for many API calls. If you consistently interact with a specific shop, configuring this value once will automatically apply it to relevant requests, streamlining your workflow.",
    defaultValue: "",
    ...jsonString,
  }),
  "organization_id": configEntry({
    description:
      "Indicates the organization ID required for some API calls. If you consistently interact with a specific organization, configuring this value once will automatically apply it to relevant requests, streamlining your workflow.",
    defaultValue: "",
    ...jsonString,
  }),
  "api": configEntry({
    description:
      "Specifies the domain used to define API endpoints. This setting is primarily intended for internal access to test environments. For most users, the default value is recommended and should suffice unless a specific requirement necessitates a change.",
    defaultValue: "lana.dev",
    ...jsonString,
  }),
  "device_id": configEntry({
    description:
      "Identifies the device used for API calls. Setting this value allows the Lana CLI tool to be easily recognized during audits or tracking activities. No need to set it manually, it will be automatically generated when necessary.",
    defaultValue: "",
    ...jsonString,
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
      try {
        const e = entries[key];
        e.value = e.fromJSON(json[key]);
      } catch {
        // do nothing
      }
    }
  } catch {
    // do nothing
  }
}

function saveConfig() {
  const cfg: Record<string, any> = {};
  for (const key of entryKeys) {
    const e: ConfigEntry<any> = entries[key];
    if (e.value === e.defaultValue) continue;
    cfg[key] = e.toJSON ? e.toJSON(e.value) : e.value;
  }
  Deno.mkdirSync(configDir, { recursive: true });
  Deno.writeTextFileSync(configFile, JSON.stringify(cfg, null, 2), { mode: 0o0600 });
}

export function getConfigInfo() {
  return {
    configFile,
    configFileExists: existsSync(configFile),
  };
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

  if (key === "jwt") {
    try {
      const vals = value.split(".");
      const shopID = JSON.parse(new TextDecoder().decode(decodeBase64(vals[1]))).shop_id;
      if (shopID && typeof shopID === "string") {
        console.log(`Shop ID is set to: ${shopID}`);
        entries.shop_id.value = shopID;
      }
    } catch {
      // do nothing
    }
  }

  saveConfig();
}

export function unsetConfigValue(name: string) {
  ensureConfigLoaded();
  const key = entryKeys.find((k) => k === name);
  if (!key) {
    console.error(`unknown config entry name: ${JSON.stringify(name)}`);
    Deno.exitCode = 1;
    return;
  }
  const e = entries[key];
  setConfigValue(e.name, e.defaultValue);
}

export function getConfigValue<K extends keyof typeof entries>(name: K): (typeof entries)[K]["value"] {
  ensureConfigLoaded();
  return entries[name].value;
}

export function getRequestContext(): Context {
  let deviceID = getConfigValue("device_id");
  if (!deviceID) {
    deviceID = crypto.randomUUID();
    setConfigValue("device_id", deviceID);
  }
  const ctx: Context = {
    deviceID,
    host: `https://api.${getConfigValue("api")}`,
    token: getConfigValue("jwt") || undefined,
  };
  return ctx;
}
