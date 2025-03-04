import * as vb from "@valibot/valibot";

export const FormatType = vb.picklist(["table", "json", "csv"]);
export type Format = vb.InferOutput<typeof FormatType>;
