import type { ProductWithMeta } from '@/lib/catalog';

const PLACEHOLDER_RE = /placeholder|no[-_]?image|default|dummy|resistor/i;

/**
 * image_urls used by 3+ different products are almost certainly a stock placeholder
 * (e.g. the same resistor photo). Cards show a category illustration for these instead.
 */
export function findSharedImages(products: ProductWithMeta[], threshold = 3): Set<string> {
  const counts = new Map<string, number>();
  for (const p of products) if (p.image_url) counts.set(p.image_url, (counts.get(p.image_url) ?? 0) + 1);
  const shared = new Set<string>();
  counts.forEach((n, url) => n >= threshold && shared.add(url));
  return shared;
}

export function isPlaceholderUrl(url: string | null | undefined) {
  return !!url && PLACEHOLDER_RE.test(url);
}
