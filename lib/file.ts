import { Context, request } from "@lana-commerce/core/json/commerce";
import { ProgressBar, ProgressBarStream } from "./progressBar.ts";
import { basename } from "@std/path";
import { CommerceFileUploadAPI } from "@lana-commerce/core/json/commerceFileUpload";
import { uploadFileGeneric } from "@lana-commerce/core/genericFile";

export async function downloadFileToFile(ctx: Context, shopID: string, fileID: string, outputPath: string) {
  const r1 = await request(ctx, "GET:files.json")
    .shop_id(shopID)
    .ids([fileID])
    .sendUnwrap();

  const file = await Deno.create(outputPath);
  try {
    let url = r1[0].public_url;
    if (!url) {
      const r2 = await request(ctx, "GET:files/download.json")
        .shop_id(shopID)
        .ids([fileID])
        .sendUnwrap();
      url = r2[0].url;
    }
    const resp = await fetch(url);
    if (resp.body) {
      const pb = new ProgressBarStream(Deno.stdout.writable, {
        max: Number(r1[0].size),
        fmt: (x) => `${x.styledTime()}${x.progressBar}${x.styledData()}${outputPath}`,
      });
      const p1 = pb.readable.pipeTo(file.writable, { preventClose: true });
      const p2 = resp.body.pipeTo(pb.writable);
      await Promise.all([p1, p2]);
    }
  } finally {
    file.close();
  }
}

export async function uploadFileToFile(ctx: Context, shopID: string, inputPath: string) {
  const fileData = Deno.readFileSync(inputPath);
  const name = basename(inputPath);
  const pb = new ProgressBar(Deno.stdout.writable, {
    max: fileData.byteLength,
    fmt: (x) => `${x.styledTime()}${x.progressBar}${x.styledData()}Uploading ${name}`,
  });
  let lastUploadedBytes = 0;
  const result = await uploadFileGeneric({
    api: new CommerceFileUploadAPI(ctx),
    contentType: "application/octet-stream",
    data: fileData,
    name,
    shopID,
    storage: "private",
    size: fileData.byteLength,
    onProgress: (report) => {
      const toAdd = report.uploadedBytes - lastUploadedBytes;
      lastUploadedBytes = report.uploadedBytes;
      pb.add(toAdd);
    },
  });
  await pb.end();
  if (result.kind !== "ok") {
    throw new Error("file upload failed");
  }
  return result.file.id;
}
