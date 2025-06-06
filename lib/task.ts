import { assertExpanded, Context, request } from "@lana-commerce/core/json/commerce";
import { ShardedTask } from "@lana-commerce/core/json/commerceTypes";
import { sleep } from "@lana-commerce/core/sleep";
import { ProgressBar } from "@std/cli/unstable-progress-bar";

export type ProgressCallback = (percentage: number) => void;

export async function waitForTask(
  ctx: Context,
  shopID: string,
  taskID: string,
  onProgress: ProgressCallback,
): Promise<ShardedTask | undefined> {
  let out: ShardedTask | undefined;
  while (true) {
    const r1 = await request(ctx, "GET:sharded_tasks.json")
      .shop_id(shopID)
      .ids([taskID])
      .expand({ items: true })
      .sendUnwrap();
    const t = assertExpanded(r1.items[0]);
    if (t.is_done) {
      out = t;
      break;
    }
    onProgress(t.progress.percentage);
    await sleep(1000);
  }
  onProgress(100);
  return out;
}

export async function waitForTaskWithProgressBar(
  ctx: Context,
  shopID: string,
  taskID: string,
  desc: string,
): Promise<ShardedTask | undefined> {
  const pb = new ProgressBar({
    writable: Deno.stdout.writable,
    max: 100,
    fmt: (x) => `[${x.styledTime}] [${x.progressBar}] ${desc}`,
  });
  const result = await waitForTask(ctx, shopID, taskID, (percentage) => {
    pb.value = Math.floor(percentage);
  });
  await pb.stop();
  return result;
}
