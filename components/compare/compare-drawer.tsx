'use client';

import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { GitCompareArrows, X, Trash2 } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Modal } from '@/components/ui/overlay';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductImage } from '@/components/product-card';
import { useCompare } from '@/lib/compare-store';
import { getProduct, getProductOffers, type ProductWithMeta } from '@/lib/catalog';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { OfferWithShop } from '@/lib/types';

type Col = { product: ProductWithMeta; offers: OfferWithShop[] };

/** Floating tray (appears when something is pinned) + side-by-side drawer for 2–3 products. */
export function CompareTray() {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const pins = useCompare();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <AnimatePresence>
        {pins.ids.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="glass fixed inset-x-4 bottom-20 z-popover sm:bottom-4 mx-auto flex max-w-md items-center justify-between gap-3 rounded-full py-2 ps-5 pe-2 shadow-3"
            role="region"
            aria-label={L('منتجات مثبّتة للمقارنة', 'Pinned for comparison')}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <GitCompareArrows className="h-4 w-4 text-accent" />
              {L(`${pins.ids.length} منتج مثبّت`, `${pins.ids.length} pinned`)}
              <span className="font-mono text-xs text-muted-foreground">/ 3</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Button size="icon" variant="ghost" className="h-9 w-9" onClick={pins.clear} aria-label={L('مسح', 'Clear')}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button size="sm" className="rounded-full" disabled={pins.ids.length < 2} onClick={() => setOpen(true)}>
                {L('قارن', 'Compare')}
              </Button>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <CompareDrawer open={open && pins.ids.length >= 2} onClose={() => setOpen(false)} />
    </>
  );
}

export function CompareDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const pins = useCompare();
  const [cols, setCols] = React.useState<Record<string, Col>>({});

  React.useEffect(() => {
    if (!open) return;
    pins.ids.filter((id) => !cols[id]).forEach(async (id) => {
      const [product, offers] = await Promise.all([getProduct(id), getProductOffers(id).catch(() => [])]);
      if (product) setCols((c) => ({ ...c, [id]: { product, offers } }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pins.ids.join(',')]);

  const list = pins.ids.map((id) => cols[id]).filter(Boolean);
  const loading = pins.ids.length > list.length;
  const specKeys = Array.from(new Set(list.flatMap((c) => Object.keys(c.product.specs ?? {}))));

  const best = (vals: (number | null)[], dir: 'min' | 'max') => {
    const v = vals.filter((x): x is number => x !== null);
    return v.length > 1 ? (dir === 'min' ? Math.min(...v) : Math.max(...v)) : null;
  };
  const lows = list.map((c) => c.offers[0]?.price ?? null);
  const lowBest = best(lows, 'min');
  const gridCols = { gridTemplateColumns: `minmax(110px,150px) repeat(${Math.max(pins.ids.length, 1)}, minmax(170px,1fr))` };

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <>
      <div className="sticky start-0 z-[1] flex items-center border-b border-border bg-card/95 px-3 py-3 text-xs font-semibold text-muted-foreground backdrop-blur">
        {label}
      </div>
      {children}
    </>
  );
  const Cell = ({ children, win }: { children: React.ReactNode; win?: boolean }) => (
    <div className={cn('flex items-center border-b border-border px-3 py-3 text-sm', win && 'bg-accent/10 font-bold text-teal-800 dark:text-accent')}>{children}</div>
  );

  return (
    <Modal open={open} onClose={onClose} label={L('مقارنة جنب بعض', 'Side-by-side comparison')} className="max-w-5xl">
      <div className="p-4 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 pe-10 font-display text-xl font-bold">
          <GitCompareArrows className="h-5 w-5 text-accent" />
          {L('مقارنة جنب بعض', 'Side-by-side comparison')}
        </h2>
        <div className="overflow-x-auto rounded-md border border-border">
          <div className="grid min-w-[560px]" style={gridCols}>
            <div className="border-b border-border" />
            {pins.ids.map((id) => {
              const c = cols[id];
              return (
                <div key={id} className="relative border-b border-s border-border p-3">
                  {c ? (
                    <>
                      <button
                        type="button"
                        onClick={() => pins.remove(id)}
                        aria-label={L('إزالة', 'Remove')}
                        className="absolute end-2 top-2 z-[1] rounded-full bg-background/80 p-1 hover:bg-destructive/15"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="mx-auto mb-2 w-24 overflow-hidden rounded-sm border border-border">
                        <ProductImage product={c.product} />
                      </div>
                      <Link href={`/products/${id}`} onClick={onClose} className="line-clamp-2 text-center text-sm font-semibold hover:text-accent">
                        {lang === 'ar' ? c.product.name_ar : c.product.name_en}
                      </Link>
                    </>
                  ) : (
                    <Skeleton className="h-36 w-full" />
                  )}
                </div>
              );
            })}

            {!loading && (
              <>
                <Row label={L('أرخص سعر', 'Best price')}>
                  {list.map((c, i) => (
                    <Cell key={c.product.id} win={lows[i] !== null && lows[i] === lowBest}>
                      <span className="price">{lows[i] !== null ? formatEGP(lows[i]!, lang) : '—'}</span>
                    </Cell>
                  ))}
                </Row>
                <Row label={L('أغلى عرض', 'Highest offer')}>
                  {list.map((c) => (
                    <Cell key={c.product.id}>
                      <span className="price">{c.offers.length ? formatEGP(c.offers[c.offers.length - 1].price, lang) : '—'}</span>
                    </Cell>
                  ))}
                </Row>
                <Row label={L('عدد المحلات', 'Shops')}>
                  {list.map((c) => {
                    const top = best(list.map((x) => x.offers.length), 'max');
                    return (
                      <Cell key={c.product.id} win={top !== null && c.offers.length === top}>
                        <span className="font-mono">{c.offers.length}</span>
                      </Cell>
                    );
                  })}
                </Row>
                <Row label={L('التوفر', 'Availability')}>
                  {list.map((c) => (
                    <Cell key={c.product.id}>
                      {c.offers.some((o) => o.in_stock) ? t('common', 'inStock', lang) : t('common', 'outOfStock', lang)}
                    </Cell>
                  ))}
                </Row>
                <Row label={t('common', 'brand', lang)}>
                  {list.map((c) => (
                    <Cell key={c.product.id}>{c.product.brand ?? '—'}</Cell>
                  ))}
                </Row>
                {specKeys.map((k) => (
                  <Row key={k} label={k.replace(/_/g, ' ')}>
                    {list.map((c) => (
                      <Cell key={c.product.id}>
                        <span className="font-mono text-xs">{c.product.specs?.[k] ?? '—'}</span>
                      </Cell>
                    ))}
                  </Row>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
