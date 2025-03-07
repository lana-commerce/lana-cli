import { readAllSync } from "@std/io/read-all";

export function assembleInputData<T extends { data?: string }>(
  opts: T,
  array: boolean,
  optsMap: Partial<Record<keyof T, string>>,
): any {
  if (opts.data === "-") {
    return JSON.parse(new TextDecoder().decode(readAllSync(Deno.stdin)));
  } else if (opts.data) {
    return JSON.parse(Deno.readTextFileSync(opts.data));
  } else {
    const inputObj: any = {};
    for (const key in optsMap) {
      const val = optsMap[key];
      if (opts[key] !== undefined) {
        inputObj[val] = opts[key];
      }
    }
    return array ? [inputObj] : inputObj;
  }
}

export interface IDer {
  id?: string;
}

export function printIDsMaybe(output: IDer | IDer[]) {
  if (Array.isArray(output)) {
    for (const v of output) {
      console.log(v.id);
    }
  } else {
    console.log(output.id);
  }
}
