import { Command } from "@cliffy/command";
import { uploadFileGeneric } from "@lana-commerce/core/genericFile";
import { CommerceFileUploadAPI } from "@lana-commerce/core/json/commerceFileUpload";
import { getConfigValue, getRequestContext } from "../lib/config.ts";
import { basename } from "@std/path";
import { ProgressBar } from "../lib/progressBar.ts";

export function addExtraCommands(cmd: Command): Command {
  return cmd
    .command("upload <...files>", "Upload one or multiple files")
    .option("--shop-id <string>", "Unique shop identifier.")
    .option("--name <string>", "Override automatically discovered file name")
    .option("--content-type <string>", "Override automatically discovered Content-Type")
    .option("--public", "Make file accessible via public CDN")
    .action(async (opts, ...files) => {
      for (const file of files) {
        const fileData = Deno.readFileSync(file);
        const name = opts.name ?? basename(file);
        const ctx = getRequestContext();
        const pb = new ProgressBar(Deno.stdout.writable, {
          max: fileData.byteLength,
          fmt: (x) => `${x.styledTime()}${x.progressBar}${x.styledData()}${name}`,
        });
        let lastUploadedBytes = 0;
        await uploadFileGeneric({
          api: new CommerceFileUploadAPI(ctx),
          contentType: opts.contentType ?? "application/octet-stream",
          data: fileData,
          name,
          shopID: opts.shopId || getConfigValue("shop_id"),
          storage: opts.public ? "general" : "private",
          size: fileData.byteLength,
          onProgress: (report) => {
            const toAdd = report.uploadedBytes - lastUploadedBytes;
            lastUploadedBytes = report.uploadedBytes;
            pb.add(toAdd);
          },
        });
        await pb.end();
      }
    })
    .reset();
}
