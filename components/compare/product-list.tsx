'use client';

import * as React from 'react';
import { Check, Pin, Search } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { CategoryArt, categoryKey } from '@/components/category-art';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompare } from '@/lib/compare-store';
import { isPlaceholderUrl } from '@/lib/product-images';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { ProductWithMeta } from '@/lib/catalog';

function Thumb({ p, shared }: { p: ProductWithMeta; shared: boolean }) {
  const [bad, setBad] = React.useState(false);
  const fallback = !p.image_url || bad || shared || isPlaceholderUrl(p.image_url);
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-gradient-to-br from-muted to-accent/10">
      {fallback ? (
        <CategoryArt kind={categoryKey(p.category)} className="h-7 w-7 text-foreground/70" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image_url!} alt="" loading="lazy" onError={() => setBad(true)} className="h-full w-full object-contain p-1" />
      )}
    </span>
  );
}

export function ProductList({
  products,
  loading,
  selectedId,
  onSelect,
  shared,
}: {
  products: ProductWithMeta[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  shared: Set<string>;
}) {
  const { lang } = useLanguage();
  const [q, setQ] = React.useState('');
  const pins = useCompare();
  const needle = q.trim().toLowerCase();
  const list = needle
    ? products.filter((p) => `${p.name_en} ${p.name_ar} ${p.sku ?? ''} ${p.brand ?? ''}`.toLowerCase().includes(needle))
    : products;

  return (
    <div className="glass flex max-h-[26rem] flex-col rounded-lg lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7.5rem)]">
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('nav', 'search', lang)}
            aria-label={t('nav', 'search', lang)}
            className="field h-10 ps-9"
          />
        </div>
        <p className="mt-2 px-1 text-xs text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">{list.length}</span> {lang === 'ar' ? 'منتج' : 'products'}
        </p>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto p-2" role="listbox" aria-label={lang === 'ar' ? 'المنتجات' : 'Products'}>
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-16 w-full rounded-sm" />
              </li>
            ))
          : list.length === 0
            ? <li className="p-6 text-center text-sm text-muted-foreground">{t('common', 'noResults', lang)}</li>
            : list.map((p) => {
                const sel = p.id === selectedId;
                const pinned = pins.has(p.id);
                return (
                  <li key={p.id} role="presentation" className="group relative">
                    <button
                      type="button"
                      role="option"
                      aria-selected={sel}
                      onClick={() => onSelect(p.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-sm border-s-4 p-2.5 pe-10 text-start transition-[background-color,border-color,box-shadow] duration-base',
                        sel
                          ? 'border-accent bg-accent/10 shadow-glow'
                          : 'border-transparent hover:bg-accent/5'
                      )}
                    >
                      <Thumb p={p} shared={!!p.image_url && shared.has(p.image_url)} />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm font-medium leading-snug">{lang === 'ar' ? p.name_ar : p.name_en}</span>
                        <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          {p.lowest_price !== null && <span className="price font-semibold text-teal-800 dark:text-accent">{formatEGP(p.lowest_price, lang)}</span>}
                          <span>· {p.offers_count} {t('common', 'offers', lang)}</span>
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={pinned}
                      aria-label={lang === 'ar' ? 'ثبّت للمقارنة' : 'Pin to compare'}
                      disabled={!pinned && pins.full}
                      onClick={() => pins.toggle(p.id)}
                      className={cn(
                        'absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition-colors disabled:opacity-30',
                        pinned ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/15'
                      )}
                    >
                      {pinned ? <Check className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </button>
                  </li>
                );
              })}
      </ul>
    </div>
  );
}
