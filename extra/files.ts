import { Command } from "@cliffy/command";
import { request } from "@lana-commerce/core/json/commerce";
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
          fmt: (x) => `${x.styledTime()}${x.progressBar}${x.styledData()}Uploading ${name}`,
        });
        let lastUploadedBytes = 0;
        await uploadFileGeneric({
          api: new CommerceFileUploadAPI(ctx),
          contentType: opts.contentType ?? "application/octet-stream",
          data: fileData.buffer,
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
    .command("download <file-id> [output]", "Download a file and save it.")
    .option("--shop-id <string>", "Unique shop identifier.")
    .action(async (opts, fileID, output) => {
      const ctx = getRequestContext();
      const r1 = await request(ctx, "GET:files.json")
        .shop_id(opts.shopId || getConfigValue("shop_id"))
        .ids([fileID])
        .sendUnwrap();
      const apiFile = r1[0];

      let writable: WritableStream<Uint8Array>;
      let finalize = () => {};
      if (!output || output === "-") {
        writable = Deno.stdout.writable;
      } else {
        const file = await Deno.create(output);
        writable = file.writable;
        finalize = () => {
          file.close();
        };
      }

      try {
        let url = apiFile.public_url;
        if (!url) {
          const r2 = await request(ctx, "GET:files/download.json")
            .shop_id(opts.shopId || getConfigValue("shop_id"))
            .ids([fileID])
            .sendUnwrap();
          url = r2[0].url;
        }
        const resp = await fetch(url);
        if (resp.body) {
          await resp.body.pipeTo(writable, { preventClose: true });
        }
      } finally {
        finalize();
      }
    })
    .reset();
}
