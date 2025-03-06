import { ValidationError } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { colors } from "@cliffy/ansi/colors";
import { stripAnsiCode } from "@std/fmt/colors";
import { unicodeWidth } from "@std/cli/unicode-width";
import * as vb from "@valibot/valibot";
import { stringify as csvStringify } from "@std/csv";

function parseOrDefault<T extends vb.GenericSchema, U>(s: T, value: any, def: U): vb.InferOutput<T> | U {
  const result = vb.safeParse(s, value);
  if (result.success) {
    return result.output;
  } else {
    return def;
  }
}

export type FormatSpec = Record<string, (v: any) => any>;

export type FormatSpecInput = Record<string, ((v: any) => any) | boolean | string | number>;

export type FormatJSON = {
  type: "json";
};
export type FormatCSV = {
  type: "csv";
  spec: FormatSpec;
  header?: boolean;
};

export type FormatTable = {
  type: "table";
  spec: FormatSpec;
  hspacing?: number;
  vspacing?: number;
  header?: boolean;
};

export type Format = FormatJSON | FormatCSV | FormatTable;

export function formatParser(tableSpec: FormatSpecInput, csvSpec?: FormatSpecInput): (format: string) => Format {
  return (format) => {
    return parseFormat(format, tableSpec, csvSpec || tableSpec);
  };
}

function parseInputSpec(s: FormatSpecInput): FormatTable {
  const out: FormatTable = {
    type: "table",
    spec: {},
  };
  for (const key in s) {
    const val = s[key];
    if (typeof val === "function") {
      out.spec[key] = val;
    } else if (key === "_hspacing") {
      out.hspacing = parseOrDefault(vb.number(), val, undefined);
    } else if (key === "_vspacing") {
      out.vspacing = parseOrDefault(vb.number(), val, undefined);
    } else if (key === "_header") {
      out.header = parseOrDefault(vb.boolean(), val, undefined);
    }
  }
  return out;
}

function fancyEval(str: string): any {
  return new Function(`with (this) { return (${str}); }`).call({ colors, noop: (v: any) => v });
}

export function parseFormat(
  format: string,
  defaultTableSpec: FormatSpecInput,
  defaultCSVSpec: FormatSpecInput,
): Format {
  if (format === "json") {
    return { type: "json" };
  } else if (format === "table") {
    return parseInputSpec(defaultTableSpec);
  } else if (format === "csv") {
    const s = parseInputSpec(defaultCSVSpec);
    return { type: "csv", spec: s.spec, header: s.header };
  } else if (format.startsWith("table")) {
    let str = format.substring("table".length + 1);
    if (str.endsWith(")")) {
      str = str.substring(0, str.length - 1);
    }
    return parseInputSpec(fancyEval(str));
  } else if (format.startsWith("csv(")) {
    let str = format.substring("csv".length + 1);
    if (str.endsWith(")")) {
      str = str.substring(0, str.length - 1);
    }
    const s = parseInputSpec(fancyEval(str));
    return { type: "csv", spec: s.spec, header: s.header };
  }
  throw new ValidationError("Unsupported or malformed format.");
}

interface ColSpec {
  w?: number;
  pw?: number;
  maxW: number;
}

function parseColSpec(w: any): Partial<ColSpec> {
  if (typeof w === "number" && w > 0) {
    return { w: Math.floor(w) };
  } else if (typeof w === "string") {
    if (w.endsWith("%")) {
      const pw = Number(w.substring(0, w.length - 1));
      if (!isNaN(pw) && pw > 0) {
        return { pw };
      }
    }
  }
  return {};
}

export function formatTable(values: any[], fmt: FormatTable): string {
  const spec = fmt.spec;
  const cols = Object.keys(spec);
  const hspacing = fmt.hspacing ?? 2;
  const vspacing = fmt.vspacing ?? 0;
  const header = fmt.header ?? true;

  let t = new Table<string[]>();
  if (header) {
    t = t.header(cols.map((c) => colors.bold(c.toUpperCase())));
  }
  t = t.padding(hspacing);
  const vs = "\n".repeat(vspacing);
  const colSpecs: ColSpec[] = cols.map(() => ({ maxW: 0 }));
  t = t.body(values.map((v, index) => {
    return cols.map((c, ci) => {
      const cs = colSpecs[ci];
      let val = "";
      try {
        const result = spec[c](v);
        if (Array.isArray(result)) {
          const [r, mw] = result;
          val = `${r}`;
          if (index === 0) {
            const ncs = parseColSpec(mw);
            cs.pw = ncs.pw;
            cs.w = ncs.w;
          }
        } else {
          val = `${result}`;
        }
      } catch {
        // do nothing
      }
      cs.maxW = Math.max(cs.maxW, unicodeWidth(stripAnsiCode(val)));
      return vs + val;
    });
  }));

  let pwSum = 0;
  for (const cs of colSpecs) {
    if (cs.pw !== undefined) {
      pwSum += cs.pw;
    }
  }
  const lastPercentColI = colSpecs.findLastIndex((c) => c.pw !== undefined);
  let availW = Deno.consoleSize().columns - (cols.length - 1) * hspacing;
  for (const cs of colSpecs) {
    if (cs.pw !== undefined) continue;
    const w = Math.min(cs.w ?? cs.maxW, cs.maxW);
    availW -= w;
  }
  let remainingW = availW;
  t = t.columns(colSpecs.map((c, i) => {
    if (c.pw === undefined) {
      return c.w !== undefined ? { maxWidth: c.w } : {};
    }
    if (i === lastPercentColI) {
      return { maxWidth: Math.max(5, remainingW) };
    } else {
      const fr = c.pw / pwSum;
      const mw = Math.max(5, Math.floor(availW * fr));
      remainingW -= mw;
      return { maxWidth: mw };
    }
  }));
  return t.toString();
}

export function formatCSV(values: any[], fmt: FormatCSV): string {
  const spec = fmt.spec;
  const cols = Object.keys(spec);
  const header = fmt.header ?? true;
  const data: string[][] = [];
  if (header) {
    data.push(cols);
  }
  for (const v of values) {
    data.push(cols.map((c) => spec[c](v)));
  }

  return csvStringify(data);
}

export function printValues(values: any[], fmt: Format) {
  if (fmt.type === "json") {
    console.log(JSON.stringify(values, null, 2));
  } else if (fmt.type === "csv") {
    Deno.stdout.writeSync(new TextEncoder().encode(formatCSV(values, fmt)));
  } else if (fmt.type === "table") {
    console.log(formatTable(values, fmt));
  }
}

export function printValue(value: any, fmt: Format) {
  if (fmt.type === "json") {
    console.log(JSON.stringify(value, null, 2));
  } else {
    printValues([value], fmt);
  }
}
