import { supabase } from '@/lib/supabase';
import { getActiveShops } from '@/lib/catalog';

/* ---------------------------------------------------------------- history */

export interface HistoryPoint {
  /** ISO day (yyyy-mm-dd) */
  day: string;
  min: number;
  max: number;
  byShop: Record<string, number>;
}

/**
 * Cheapest/highest price per day over the last N days, built from `price_history`
 * (see supabase/part4.sql). Each shop's last known price is carried forward between changes.
 * Returns available:false when the table doesn't exist yet or has < 2 days of data.
 */
export async function getPriceHistory(
  productId: string,
  days: number
): Promise<{ available: boolean; points: HistoryPoint[] }> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from('price_history')
    .select('price, recorded_at, shop:shops(name)')
    .eq('product_id', productId)
    .order('recorded_at', { ascending: true });
  if (error || !data?.length) return { available: false, points: [] };

  type Row = { price: number; recorded_at: string; shop: { name: string } | { name: string }[] | null };
  const rows = (data as unknown as Row[]).map((r) => ({
    price: Number(r.price),
    at: new Date(r.recorded_at),
    shop: (Array.isArray(r.shop) ? r.shop[0]?.name : r.shop?.name) ?? '—',
  }));

  const start = new Date(since);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  const last = new Map<string, number>();
  let i = 0;
  // prices recorded before the window still count as "current" at its start
  while (i < rows.length && rows[i].at < start) {
    last.set(rows[i].shop, rows[i].price);
    i++;
  }
  const points: HistoryPoint[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    while (i < rows.length && rows[i].at < next) {
      last.set(rows[i].shop, rows[i].price);
      i++;
    }
    if (last.size) {
      const vals = Array.from(last.values());
      points.push({
        day: d.toISOString().slice(0, 10),
        min: Math.min(...vals),
        max: Math.max(...vals),
        byShop: Object.fromEntries(last),
      });
    }
  }
  return { available: points.length >= 2, points };
}

/* ----------------------------------------------------------------- alerts */

export async function createPriceAlert(input: {
  product_id: string;
  contact: string;
  target_price: number | null;
  notify_new_shop: boolean;
}) {
  const { error } = await supabase.from('price_alerts').insert({
    product_id: input.product_id,
    contact: input.contact,
    target_price: input.target_price,
    notify_new_shop: input.notify_new_shop,
  });
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------- shop logos */

let logoCache: Map<string, string | null> | null = null;
export async function getShopLogos(): Promise<Map<string, string | null>> {
  if (logoCache) return logoCache;
  const shops = await getActiveShops().catch(() => []);
  logoCache = new Map(shops.map((s) => [s.id, s.logo_url]));
  return logoCache;
}
