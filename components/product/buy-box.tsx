'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, GitCompareArrows, Heart, Minus, Plus, ShoppingCart, Zap, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCompare } from '@/lib/compare-store';
import { useWishlist } from '@/lib/wishlist';
import { useAddOffer } from '@/lib/use-add-to-cart';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { ProductWithMeta } from '@/lib/catalog';
import type { OfferWithShop } from '@/lib/types';

export function BuyBox({
  product,
  offers,
  onAlert,
}: {
  product: ProductWithMeta;
  offers: OfferWithShop[];
  onAlert: () => void;
}) {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const router = useRouter();
  const addOffer = useAddOffer(product);
  const wish = useWishlist(product.id);
  const pins = useCompare();
  const [qty, setQty] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  const addRef = React.useRef<HTMLButtonElement>(null);

  const best = offers[0] ?? null;
  const highest = offers.length ? offers[offers.length - 1].price : null;
  const buyable = offers.find((o) => o.shop?.is_partner && o.in_stock) ?? null;
  const anyStock = offers.some((o) => o.in_stock);
  const saving = best && highest && highest > best.price ? { amount: highest - best.price, pct: Math.round(((highest - best.price) / highest) * 100) } : null;
  const external = !buyable ? offers.find((o) => o.shop?.external_url) : null;
  const pinned = pins.has(product.id);

  return (
    <div className="glass space-y-5 rounded-lg p-5 shadow-3">
      {/* price */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {best ? (
            <>
              <span className="text-xs font-medium text-muted-foreground">{t('common', 'from', lang)}</span>
              <Badge variant="deal" className="text-[10px]">{t('product', 'bestPrice', lang)}</Badge>
            </>
          ) : null}
        </div>
        <div className="price mt-1 text-4xl font-bold tracking-tight">
          {best ? formatEGP(best.price, lang) : '—'}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{t('product', 'offersCount', lang).replace('{count}', String(offers.length))}</span>
          {saving && (
            <span className="font-semibold text-amber-900 dark:text-deal">
              {L('وفّر', 'Save up to')} {formatEGP(saving.amount, lang)} ({saving.pct}%)
            </span>
          )}
        </div>
        <p className={cn('mt-3 inline-flex items-center gap-1.5 text-sm font-medium', anyStock ? 'text-emerald-800 dark:text-emerald-400' : 'text-red-800 dark:text-red-400')}>
          <span className={cn('h-2 w-2 rounded-full', anyStock ? 'bg-emerald-500' : 'bg-red-500')} aria-hidden />
          {anyStock ? t('common', 'inStock', lang) : t('common', 'outOfStock', lang)}
        </p>
        {buyable && best && buyable.price > best.price && (
          <p className="mt-2 rounded-sm bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
            {L('أرخص سعر تقدر تطلبه مباشرة من شريك:', 'Cheapest you can order directly from a partner:')}{' '}
            <span className="price font-semibold text-foreground">{formatEGP(buyable.price, lang)}</span> · {buyable.shop.name}
          </p>
        )}
      </div>

      {/* qty + actions */}
      {buyable ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span id="qty-label" className="text-sm font-medium">{L('الكمية', 'Quantity')}</span>
            <div role="group" aria-labelledby="qty-label" className="flex items-center rounded-sm border border-input">
              <button type="button" aria-label={L('أقل', 'Decrease')} disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-10 w-10 items-center justify-center rounded-s-sm hover:bg-accent/10 disabled:opacity-40">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-mono text-sm font-bold" aria-live="polite">{qty}</span>
              <button type="button" aria-label={L('أكتر', 'Increase')} disabled={qty >= 20} onClick={() => setQty((q) => Math.min(20, q + 1))} className="flex h-10 w-10 items-center justify-center rounded-e-sm hover:bg-accent/10 disabled:opacity-40">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="ms-auto price text-sm font-semibold">{formatEGP(buyable.price * qty, lang)}</span>
          </div>

          <Button
            ref={addRef}
            size="lg"
            className="w-full"
            onClick={() => {
              if (addOffer(buyable, qty, addRef.current)) {
                setAdded(true);
                window.setTimeout(() => setAdded(false), 1400);
              }
            }}
          >
            {added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
            {added ? L('اتضاف للسلة', 'Added to cart') : t('common', 'addToCart', lang)}
          </Button>
          <Button
            size="lg"
            variant="deal"
            className="w-full"
            onClick={() => {
              if (addOffer(buyable, qty)) router.push('/checkout');
            }}
          >
            <Zap className="h-5 w-5" />
            {L('اشتري الآن', 'Buy now')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3 rounded-md border border-dashed border-border p-4 text-sm">
          <p className="text-muted-foreground">
            {offers.length
              ? L('المنتج ده مش متاح للطلب المباشر من شركائنا دلوقتي. تقدر تزور المحل.', 'Not available to order directly from our partners right now. You can visit the shop.')
              : L('مفيش عروض حاليًا.', 'No offers at the moment.')}
          </p>
          {external?.shop?.external_url && (
            <Button asChild variant="outline" className="w-full">
              <a href={external.shop.external_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                {t('common', 'visitShop', lang)} · {external.shop.name}
              </a>
            </Button>
          )}
        </div>
      )}

      {/* secondary actions */}
      <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
        <Button variant="ghost" size="sm" aria-pressed={wish.liked} onClick={wish.toggle} className="flex-col gap-1 h-auto py-2 text-xs">
          <Heart className={cn('h-4 w-4', wish.liked && 'fill-destructive text-destructive')} />
          {L('المفضلة', 'Wishlist')}
        </Button>
        <Button variant="ghost" size="sm" aria-pressed={pinned} disabled={!pinned && pins.full} onClick={() => pins.toggle(product.id)} className="flex-col gap-1 h-auto py-2 text-xs">
          <GitCompareArrows className={cn('h-4 w-4', pinned && 'text-accent')} />
          {pinned ? L('مثبّت', 'Pinned') : L('قارن', 'Compare')}
        </Button>
        <Button variant="ghost" size="sm" onClick={onAlert} className="flex-col gap-1 h-auto py-2 text-xs">
          <Bell className="h-4 w-4" />
          {L('نبّهني', 'Alert')}
        </Button>
      </div>
    </div>
  );
}
