'use client';

import * as React from 'react';
import { Search, Check } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { CategoryArt, categoryKey } from '@/components/category-art';
import { PriceSlider } from '@/components/ui/price-slider';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';

export interface Filters {
  query: string;
  categories: string[]; // category ids
  brands: string[];
  price: [number, number] | null; // null = full range
  inStockOnly: boolean;
  partnerOnly: boolean;
}

export const EMPTY_FILTERS: Filters = {
  query: '',
  categories: [],
  brands: [],
  price: null,
  inStockOnly: false,
  partnerOnly: false,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-b border-border/70 pb-5 last:border-0 last:pb-0">
      <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function FilterPanel({
  filters,
  onChange,
  categories,
  categoryCounts,
  brands,
  bounds,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  categories: Category[];
  categoryCounts: Record<string, number>;
  brands: { name: string; count: number }[];
  bounds: [number, number];
}) {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [brandQ, setBrandQ] = React.useState('');
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const shownBrands = brands.filter((b) => b.name.toLowerCase().includes(brandQ.trim().toLowerCase()));
  const price = filters.price ?? bounds;

  return (
    <div className="space-y-5">
      <Section title={L('التصنيف', 'Category')}>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const on = filters.categories.includes(c.id);
            const n = categoryCounts[c.id] ?? 0;
            return (
              <button
                key={c.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={n === 0 && !on}
                onClick={() => set({ categories: toggle(filters.categories, c.id) })}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border py-1 ps-2 pe-2.5 text-xs font-medium',
                  'transition-[background-color,border-color,box-shadow,transform] duration-base ease-out motion-safe:active:scale-95',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                  on
                    ? 'border-accent/60 bg-accent/15 text-foreground shadow-glow'
                    : 'border-border bg-card/70 text-muted-foreground hover:border-accent/40 hover:text-foreground'
                )}
              >
                <span className="relative flex h-5 w-5 items-center justify-center">
                  {on ? <Check className="h-4 w-4 text-accent" /> : <CategoryArt kind={categoryKey(c)} className="h-5 w-5" />}
                </span>
                <span>{lang === 'ar' ? c.name_ar : c.name_en}</span>
                <span className="font-mono text-[10px] opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={L('الماركة', 'Brand')}>
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={brandQ}
            onChange={(e) => setBrandQ(e.target.value)}
            placeholder={L('ابحث عن ماركة…', 'Search brands…')}
            className="field h-9 !min-h-0 ps-9"
          />
        </div>
        <ul className="max-h-44 space-y-0.5 overflow-y-auto pe-1">
          {shownBrands.length === 0 && (
            <li className="py-2 text-center text-xs text-muted-foreground">{L('لا توجد ماركات', 'No brands')}</li>
          )}
          {shownBrands.map((b) => {
            const on = filters.brands.includes(b.name);
            return (
              <li key={b.name}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => set({ brands: toggle(filters.brands, b.name) })}
                  className="flex w-full items-center gap-2.5 rounded-xs px-1.5 py-1.5 text-start text-sm hover:bg-accent/10"
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-fast',
                      on ? 'border-accent bg-accent text-accent-foreground' : 'border-input'
                    )}
                  >
                    {on && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{b.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{b.count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title={L('السعر', 'Price')}>
        {bounds[1] > bounds[0] ? (
          <PriceSlider
            min={bounds[0]}
            max={bounds[1]}
            value={[Math.max(price[0], bounds[0]), Math.min(price[1], bounds[1])]}
            onChange={(v) => set({ price: v[0] <= bounds[0] && v[1] >= bounds[1] ? null : v })}
          />
        ) : (
          <p className="text-xs text-muted-foreground">{L('نطاق سعر واحد', 'Single price point')}</p>
        )}
      </Section>

      <Section title={L('التوفر', 'Availability')}>
        <ToggleSwitch
          checked={filters.inStockOnly}
          onCheckedChange={(v) => set({ inStockOnly: v })}
          label={L('المتوفر فقط', 'In stock only')}
        />
        <ToggleSwitch
          checked={filters.partnerOnly}
          onCheckedChange={(v) => set({ partnerOnly: v })}
          label={L('المحلات الشريكة فقط', 'Partner shops only')}
          hint={L('تقدر تطلب منها مباشرة', 'You can order from these directly')}
        />
      </Section>
    </div>
  );
}
