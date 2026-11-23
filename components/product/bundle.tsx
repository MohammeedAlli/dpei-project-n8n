'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { ProductImage } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { useAddMany } from '@/lib/use-add-to-cart';
import { formatEGP } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ProductWithMeta } from '@/lib/catalog';

/** "Frequently bought together": tick the items you want, see the bundle total, add them in one go. */
export function Bundle({ product, complements }: { product: ProductWithMeta; complements: ProductWithMeta[] }) {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const items = [product, ...complements];
  const [on, setOn] = React.useState<Set<string>>(new Set(items.map((p) => p.id)));
  const { busy, addMany } = useAddMany();

  const chosen = items.filter((p) => on.has(p.id));
  const total = chosen.reduce((s, p) => s + (p.lowest_price ?? 0), 0);
  const toggle = (id: string) => {
    if (id === product.id) return; // the main product always stays
    setOn((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <section aria-labelledby="fbt-title" className="rounded-lg border border-border bg-card p-5 shadow-2 sm:p-6">
      <h2 id="fbt-title" className="mb-4 font-display text-xl font-bold">
        {L('بيتشرى معاه كتير', 'Frequently bought together')}
      </h2>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <ul className="flex flex-1 flex-wrap items-stretch gap-3 sm:flex-nowrap sm:items-center">
          {items.map((p, i) => {
            const checked = on.has(p.id);
            return (
              <React.Fragment key={p.id}>
                {i > 0 && <li aria-hidden className="hidden text-muted-foreground sm:block"><Plus className="h-5 w-5" /></li>}
                <li className={cn('relative w-[calc(50%-6px)] overflow-hidden rounded-md border bg-background/60 transition-opacity sm:w-auto sm:flex-1', checked ? 'border-accent/40' : 'border-border opacity-55')}>
                  <label className="absolute start-2 top-2 z-[1] flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={p.id === product.id}
                      onChange={() => toggle(p.id)}
                      aria-label={lang === 'ar' ? p.name_ar : p.name_en}
                      className="h-4 w-4 accent-[hsl(var(--accent))]"
                    />
                  </label>
                  <Link href={`/products/${p.id}`} className="block">
                    <ProductImage product={p} className="!aspect-[4/3]" />
                    <div className="space-y-0.5 p-2.5">
                      <p className="line-clamp-2 text-xs font-medium leading-snug">{lang === 'ar' ? p.name_ar : p.name_en}</p>
                      <p className="price text-sm font-bold">{p.lowest_price !== null ? formatEGP(p.lowest_price, lang) : '—'}</p>
                    </div>
                  </Link>
                </li>
              </React.Fragment>
            );
          })}
        </ul>

        <div className="flex shrink-0 flex-col gap-3 rounded-md bg-muted/50 p-4 lg:w-60">
          <div>
            <p className="text-xs text-muted-foreground">{L(`إجمالي ${chosen.length} منتجات`, `Bundle total · ${chosen.length} items`)}</p>
            <p className="price text-2xl font-bold">{formatEGP(total, lang)}</p>
          </div>
          <Button disabled={busy || chosen.length === 0} onClick={() => addMany(chosen)}>
            <ShoppingCart className="h-4 w-4" />
            {busy ? '…' : L('أضف الكل للسلة', 'Add all to cart')}
          </Button>
        </div>
      </div>
    </section>
  );
}
