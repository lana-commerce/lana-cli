import { version } from "./lib/version.ts";

const v = Deno.args[0];
if (v !== version) {
  throw new Error(`versions mismatch, CLI arg: ${v}, baked in: ${version}`);
}
