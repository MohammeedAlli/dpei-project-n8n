'use client';

import * as React from 'react';
import Link from 'next/link';
import { BellRing, ExternalLink, GitCompareArrows, Pin, PinOff, Store } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { ProductImage } from '@/components/product-card';
import { OfferRow } from '@/components/compare/offer-row';
import { PriceBars } from '@/components/compare/price-bars';
import { PriceHistoryChart } from '@/components/compare/price-history-chart';
import { PriceAlertDialog } from '@/components/compare/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompare, MAX_PINS } from '@/lib/compare-store';
import { getShopLogos } from '@/lib/price-data';
import { getProductOffers, type ProductWithMeta } from '@/lib/catalog';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';
import type { OfferWithShop } from '@/lib/types';

export function savingFor(offers: OfferWithShop[]) {
  if (offers.length < 2) return null;
  const prices = offers.map((o) => o.price);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  if (hi <= lo) return null;
  return { amount: hi - lo, pct: Math.round(((hi - lo) / hi) * 100) };
}

export function OffersPanel({ product }: { product: ProductWithMeta }) {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [offers, setOffers] = React.useState<OfferWithShop[] | null>(null);
  const [logos, setLogos] = React.useState<Map<string, string | null>>(new Map());
  const [alertOpen, setAlertOpen] = React.useState(false);
  const pins = useCompare();
  const pinned = pins.has(product.id);

  React.useEffect(() => {
    let live = true;
    setOffers(null);
    getProductOffers(product.id)
      .then((o) => live && setOffers(o))
      .catch(() => live && setOffers([]));
    getShopLogos().then((m) => live && setLogos(m));
    return () => {
      live = false;
    };
  }, [product.id]);

  const name = lang === 'ar' ? product.name_ar : product.name_en;
  const catName = product.category ? (lang === 'ar' ? product.category.name_ar : product.category.name_en) : null;
  const specs = Object.entries(product.specs ?? {}).slice(0, 4);
  const saving = offers ? savingFor(offers) : null;
  const best = offers?.[0]?.price ?? null;

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------------ header */}
      <header className="glass flex flex-col gap-5 rounded-lg p-4 sm:flex-row sm:p-5">
        <div className="w-full shrink-0 overflow-hidden rounded-md border border-border sm:w-44">
          <ProductImage product={product} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {catName && <Badge variant="default">{catName}</Badge>}
            {product.brand && <Badge variant="secondary">{product.brand}</Badge>}
            {product.sku && <Badge variant="mono">{product.sku}</Badge>}
          </div>
          <h2 className="font-display text-2xl font-bold leading-snug">{name}</h2>

          {specs.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
              {specs.map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="truncate text-[11px] font-medium capitalize text-muted-foreground">{k.replace(/_/g, ' ')}</dt>
                  <dd className="truncate font-mono text-xs font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              variant={pinned ? 'secondary' : 'outline'}
              aria-pressed={pinned}
              disabled={!pinned && pins.full}
              onClick={() => pins.toggle(product.id)}
              title={!pinned && pins.full ? L(`الحد الأقصى ${MAX_PINS}`, `Max ${MAX_PINS} products`) : undefined}
            >
              {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              {pinned ? L('إلغاء التثبيت', 'Unpin') : L('ثبّت للمقارنة', 'Pin to compare')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAlertOpen(true)}>
              <BellRing className="h-4 w-4" />
              {L('نبّهني', 'Price alert')}
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={`/products/${product.id}`}>{t('common', 'viewDetails', lang)}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------ offers */}
      <section aria-labelledby="offers-title" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 id="offers-title" className="font-display text-lg font-bold">
              {L('العروض مرتّبة بالسعر', 'Offers, cheapest first')}
            </h3>
            {offers && (
              <p className="text-sm text-muted-foreground">
                {t('product', 'offersCount', lang).replace('{count}', String(offers.length))}
              </p>
            )}
          </div>
          {saving && (
            <span className="rounded-full border border-deal/40 bg-deal/15 px-3 py-1 text-xs font-bold text-amber-900 dark:text-deal">
              {L('الفرق بين أرخص وأغلى عرض', 'Spread cheapest → highest')}: {formatEGP(saving.amount, lang)}
            </span>
          )}
        </div>

        {offers === null ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-md" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <NoOffers onAlert={() => setAlertOpen(true)} />
        ) : (
          <>
            <ul className="space-y-3">
              {offers.map((o, i) => (
                <li key={o.id}>
                  <OfferRow
                    offer={o}
                    product={product}
                    best={i === 0 && offers.length > 0}
                    saving={i === 0 ? saving : null}
                    logo={logos.get(o.shop_id)}
                    onAlert={() => setAlertOpen(true)}
                  />
                </li>
              ))}
            </ul>

            {offers.length === 1 && <SingleShopNote shop={offers[0].shop?.name ?? ''} onAlert={() => setAlertOpen(true)} />}
          </>
        )}
      </section>

      {/* -------------------------------------------- bars + history */}
      {offers && offers.length >= 2 && (
        <section className="rounded-md border border-border bg-card p-4 shadow-1 sm:p-5" aria-labelledby="bars-title">
          <h3 id="bars-title" className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
            <GitCompareArrows className="h-4 w-4 text-accent" />
            {L('مقارنة الأسعار بين المحلات', 'Price by shop')}
          </h3>
          <PriceBars offers={offers} />
        </section>
      )}

      <PriceHistoryChart productId={product.id} />

      <PriceAlertDialog product={product} open={alertOpen} onClose={() => setAlertOpen(false)} currentBest={best} />
    </div>
  );
}

function SingleShopNote({ shop, onAlert }: { shop: string; onAlert: () => void }) {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  return (
    <div className="bg-pcb flex flex-col items-start gap-3 rounded-md border border-dashed border-accent/40 bg-accent/5 p-5 sm:flex-row sm:items-center">
      <span className="icon-well shrink-0"><Store className="h-5 w-5" /></span>
      <div className="flex-1">
        <p className="font-semibold">
          {L(`محل واحد بس (${shop}) بيعرض المنتج ده`, `Only 1 shop lists this item (${shop})`)}
        </p>
        <p className="text-sm text-muted-foreground">
          {L('فعّل تنبيه وهنقولك أول ما محلات تانية تضيفه، عشان تقارن وتوفّر.', 'Set an alert to be notified when more shops add it, so you can compare and save.')}
        </p>
      </div>
      <Button onClick={onAlert} variant="outline" className="shrink-0">
        <BellRing className="h-4 w-4" />
        {L('نبّهني', 'Notify me')}
      </Button>
    </div>
  );
}

function NoOffers({ onAlert }: { onAlert: () => void }) {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  return (
    <div className="rounded-md border border-dashed border-border p-8 text-center">
      <ExternalLink className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
      <p className="font-semibold">{L('مفيش محل بيعرض المنتج ده دلوقتي', 'No shop lists this item right now')}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {L('فعّل تنبيه وهنبعتلك أول ما يتوفر.', "Set an alert and we'll tell you the moment it's available.")}
      </p>
      <Button onClick={onAlert} className="mt-4">
        <BellRing className="h-4 w-4" />
        {L('نبّهني', 'Notify me')}
      </Button>
    </div>
  );
}
