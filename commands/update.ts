import { Command } from "@cliffy/command";
import * as path from "@std/path";
import { UntarStream } from "@std/tar/untar-stream";
import { version } from "../lib/version.ts";
import { ZipReader } from "@zip-js/zip-js";

// TODO: remove this, it is temporary
const DEBUG = true;

function getLatestReleaseURL(v: string) {
  if (Deno.build.os === "linux") {
    return `https://github.com/lana-commerce/lana-cli/releases/download/${v}/lana-${v}-linux.x86_64.tar.gz`;
  } else if (Deno.build.os === "windows") {
    return `https://github.com/lana-commerce/lana-cli/releases/download/${v}/lana-${v}-windows.x86_64.zip`;
  } else if (Deno.build.os === "darwin") {
    return `https://github.com/lana-commerce/lana-cli/releases/download/${v}/lana-${v}-darwin.x86_64.zip`;
  } else {
    throw new Error(`unsupported OS: ${Deno.build.os}`);
  }
}

async function downloadLatestRelease(archivePath: string, url: string) {
  let r: ReadableStream<Uint8Array<ArrayBufferLike>> | null;
  if (DEBUG) {
    // TODO: remove this, it is temporary
    r = (await Deno.open(path.join(`/home/nsf/tmp/trunkery2/lana-cli`, path.basename(getLatestReleaseURL("0.0.4")))))
      .readable;
  } else {
    r = (await fetch(url)).body;
  }

  if (r) {
    await r.pipeTo((await Deno.create(archivePath)).writable);
  }
}

async function unpackTheReleaseTo(archivePath: string, dstPath: string) {
  if (archivePath.endsWith(".tar.gz")) {
    for await (
      const entry of (await Deno.open(archivePath))
        .readable
        .pipeThrough(new DecompressionStream("gzip"))
        .pipeThrough(new UntarStream())
    ) {
      if (entry.path === "lana") {
        const dst = await Deno.open(dstPath, { write: true, create: true, truncate: true, mode: 0o755 });
        await entry.readable?.pipeTo(dst.writable);
      }
    }
  } else if (archivePath.endsWith(".zip")) {
    const zipReader = new ZipReader((await Deno.open(archivePath)).readable);
    const firstEntry = (await zipReader.getEntries()).shift();
    if (!firstEntry || !firstEntry.getData) throw new Error(`empty archive?: ${archivePath}`);
    const dst = await Deno.open(dstPath, { write: true, create: true, truncate: true, mode: 0o755 });
    await firstEntry.getData(dst.writable);
    await zipReader.close();
  } else {
    throw new Error(`unrecognized archive file: ${archivePath}`);
  }
}

async function getLatestVersion() {
  // TODO: replace this, it is temporary
  return "0.0.5";
}

const cmd = new Command()
  .action(async () => {
    const execPath = Deno.execPath();
    if (path.basename(execPath) !== "lana") {
      throw new Error(`"lana update" only works on a compiled Lana Commerce CLI binary`);
    }

    const latestVersion = await getLatestVersion();
    if (version === latestVersion) {
      console.log(`Lana Commerce CLI version is up to date: ${version}`);
      return;
    }

    console.log(`Latest version is ${latestVersion}, local version is ${version}, updating`);
    const tmpDir = await Deno.makeTempDir({ prefix: "lana-cli-update-" });
    console.log(`Created temporary directory: ${JSON.stringify(tmpDir)}`);
    const releaseURL = getLatestReleaseURL(latestVersion);
    const releaseDst = path.join(tmpDir, path.basename(releaseURL));
    const lanaDstPath = path.join(path.dirname(execPath), "lana.tmp");
    console.log(`Downloading latest release\n from ${JSON.stringify(releaseURL)}\n to   ${JSON.stringify(releaseDst)}`);
    await downloadLatestRelease(releaseDst, releaseURL);
    console.log(`Unpacking the release to ${JSON.stringify(lanaDstPath)}`);
    await unpackTheReleaseTo(releaseDst, lanaDstPath);
    console.log(`Overwriting the ${JSON.stringify(execPath)} with ${JSON.stringify(lanaDstPath)}`);
    await Deno.rename(lanaDstPath, execPath);
    console.log(`Removing ${JSON.stringify(releaseDst)}`);
    await Deno.remove(releaseDst);
    console.log(`Removing ${JSON.stringify(tmpDir)}`);
    await Deno.remove(tmpDir);
    console.log(`Update successful!`);
  })
  .reset();

export default cmd;
