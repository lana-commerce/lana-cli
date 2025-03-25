import { formatCurrency as formatCurrencyCore } from "@lana-commerce/core/formatCurrency";
import { Context, request } from "@lana-commerce/core/json/commerce";
import { Currency, InfoCurrency, Shop } from "@lana-commerce/core/json/commerceTypes";
import xdg from "xdg_portable";
import * as path from "@std/path";

const cacheDir = path.join(xdg.config(), "lana-cli", "cache");

const CACHE_VALID_DURATION = 6 * 60 * 60 * 1000; // 6 hours
//                           h    m    s     ms

interface CacheEntry<T> {
  data: T | null;
  updatedAt: number;
}

interface CacheSpec<T> {
  requiresShopID: boolean;
  fileName(shopID: string): string;
  update(ctx: Context, shopID: string): Promise<T>;
  entry: CacheEntry<T>;
}

const shopCacheSpec: CacheSpec<Shop> = {
  requiresShopID: true,
  fileName: (shopID) => `${shopID}_shop.json`,
  async update(ctx: Context, shopID: string) {
    const resp = await request(ctx, "GET:shops.json").shop_id(shopID).sendUnwrap();
    return resp[0];
  },
  entry: { data: null, updatedAt: 0 },
};

const infoCurrenciesCacheSpec: CacheSpec<InfoCurrency[]> = {
  requiresShopID: false,
  fileName: () => `info_currencies.json`,
  async update(ctx: Context) {
    const resp = await request(ctx, "GET:info/currencies.json").sendUnwrap();
    return resp;
  },
  entry: { data: null, updatedAt: 0 },
};

const currenciesCacheSpec: CacheSpec<Currency[]> = {
  requiresShopID: true,
  fileName: (shopID) => `${shopID}_currencies.json`,
  async update(ctx: Context, shopID: string) {
    const resp = await request(ctx, "GET:currencies.json").shop_id(shopID).sendUnwrap();
    return resp;
  },
  entry: { data: null, updatedAt: 0 },
};

const allCacheSpecs: CacheSpec<any>[] = [
  shopCacheSpec,
  infoCurrenciesCacheSpec,
  currenciesCacheSpec,
];

export function formatCurrency(value: number, currency?: string): string {
  if (!currency) {
    currency = shopCacheSpec.entry.data?.currency;
  }
  if (!currency) {
    currency = "USD";
  }

  const c1 = currenciesCacheSpec.entry.data?.find((c) => c.currency.code === currency);
  if (c1) {
    return formatCurrencyCore(c1, value);
  }
  const c2 = infoCurrenciesCacheSpec.entry.data?.find((c) => c.code === currency);
  if (c2 && c2.currency_format) {
    return formatCurrencyCore({ currency: c2, format: c2.currency_format }, value);
  }
  return `${value}`;
}

export async function updateAllCacheEntries(ctx: Context, shopID: string) {
  Deno.mkdirSync(cacheDir, { recursive: true });
  const promises: Promise<void>[] = [];
  const now = Date.now();
  for (const cs of allCacheSpecs) {
    if (!shopID && cs.requiresShopID) continue;
    const filePath = path.join(cacheDir, cs.fileName(shopID));
    try {
      cs.entry = JSON.parse(Deno.readTextFileSync(filePath));
    } catch {
      // do nothing on error
    }
    if (cs.entry.updatedAt + CACHE_VALID_DURATION >= now) {
      continue;
    }

    promises.push((async () => {
      try {
        cs.entry.data = await cs.update(ctx, shopID);
        cs.entry.updatedAt = now;
        Deno.writeTextFileSync(filePath, JSON.stringify(cs.entry));
      } catch {
        // do nothing
      }
    })());
  }
  await Promise.all(promises);
}
