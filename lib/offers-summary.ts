'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';

export type OfferSummary = {
  /** every active shop's price for this product, ascending */
  prices: number[];
  inStock: boolean;
  /** an in-stock offer from a partner shop exists (can be added to the cart) */
  partnerInStock: boolean;
  shops: { name: string; logo_url: string | null; is_partner: boolean }[];
};

const EMPTY: OfferSummary = { prices: [], inStock: false, partnerInStock: false, shops: [] };

const cache = new Map<string, OfferSummary>();
const pending = new Set<string>();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

type Row = {
  product_id: string;
  price: number;
  in_stock: boolean;
  shop: { name: string; logo_url: string | null; is_partner: boolean; is_active: boolean } | null;
};

async function flush() {
  timer = undefined;
  const ids = Array.from(pending);
  pending.clear();
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const { data, error } = await supabase
      .from('offers')
      .select('product_id, price, in_stock, shop:shops!inner(name, logo_url, is_partner, is_active)')
      .in('product_id', chunk);
    if (error) console.error('[offers-summary]', error.message);
    const byProduct = new Map<string, Row[]>();
    for (const r of (data ?? []) as unknown as Row[]) {
      if (!r.shop?.is_active) continue;
      byProduct.set(r.product_id, [...(byProduct.get(r.product_id) ?? []), r]);
    }
    for (const id of chunk) {
      const rows = (byProduct.get(id) ?? []).sort((a, b) => a.price - b.price);
      const seen = new Set<string>();
      cache.set(id, {
        prices: rows.map((r) => r.price),
        inStock: rows.some((r) => r.in_stock),
        partnerInStock: rows.some((r) => r.in_stock && r.shop?.is_partner),
        shops: rows
          .filter((r) => r.shop && !seen.has(r.shop.name) && !!seen.add(r.shop.name))
          .map((r) => ({ name: r.shop!.name, logo_url: r.shop!.logo_url, is_partner: r.shop!.is_partner })),
      });
    }
  }
  listeners.forEach((f) => f());
}

/** Batches every card's request into ONE query (40 ms window) and caches the result. */
export function useOfferSummary(productId: string): OfferSummary | null {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    listeners.add(force);
    if (!cache.has(productId)) {
      pending.add(productId);
      timer ??= setTimeout(flush, 40);
    }
    return () => {
      listeners.delete(force);
    };
  }, [productId]);
  return cache.get(productId) ?? null;
}

export { EMPTY as EMPTY_SUMMARY };
