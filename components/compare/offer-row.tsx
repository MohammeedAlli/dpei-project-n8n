'use client';

import * as React from 'react';
import Link from 'next/link';
import { BadgeCheck, Bell, Check, Crown, ExternalLink, ShoppingCart, Store, Truck, X } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getFreshness } from '@/lib/freshness';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';
import { useAddOffer } from '@/lib/use-add-to-cart';
import { cn } from '@/lib/utils';
import type { ProductWithMeta } from '@/lib/catalog';
import type { OfferWithShop } from '@/lib/types';

export interface OfferRowProps {
  offer: OfferWithShop;
  product: ProductWithMeta;
  best?: boolean;
  /** saving vs the highest offer — only passed for the best row */
  saving?: { amount: number; pct: number } | null;
  logo?: string | null;
  onAlert?: () => void;
  /** hide "View details" (e.g. already on the details page) */
  hideDetails?: boolean;
}

export function ShopAvatar({ name, logo, className }: { name: string; logo?: string | null; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-muted text-sm font-bold uppercase text-muted-foreground',
        className
      )}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-full w-full object-cover" />
      ) : name.trim() ? (
        name.trim().charAt(0)
      ) : (
        <Store className="h-5 w-5" />
      )}
    </span>
  );
}

export function OfferRow({ offer, product, best, saving, logo, onAlert, hideDetails }: OfferRowProps) {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const addOffer = useAddOffer(product);
  const [added, setAdded] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const fresh = getFreshness(offer.last_updated_at, lang);
  const shop = offer.shop;
  const partner = !!shop?.is_partner;
  const canBuy = partner && offer.in_stock;

  const shipping = (() => {
    if (!partner) return L('الشحن من المحل مباشرة', 'Ships directly from the shop');
    const days = shop.delivery_days_text;
    const fee =
      shop.delivery_fee > 0
        ? shop.free_delivery_threshold > 0
          ? L(`شحن ${shop.delivery_fee} ج.م · مجاني فوق ${shop.free_delivery_threshold}`, `${formatEGP(shop.delivery_fee, 'en')} shipping · free over ${shop.free_delivery_threshold}`)
          : L(`شحن ${shop.delivery_fee} ج.م`, `${formatEGP(shop.delivery_fee, 'en')} shipping`)
        : L('شحن مجاني', 'Free shipping');
    return [days, fee].filter(Boolean).join(' · ');
  })();

  const row = (
    <div
      className={cn(
        'relative flex flex-col gap-4 rounded-[calc(var(--radius)-2px)] bg-card p-4',
        'sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center',
        best && 'bg-gradient-to-br from-accent/10 via-card to-card'
      )}
    >
      <div className="flex min-w-0 gap-3.5">
        <ShopAvatar name={shop?.name ?? ''} logo={logo} />
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate font-semibold">{shop?.name}</span>
            {partner ? (
              <Badge variant="default" className="gap-1 text-[10px]">
                <BadgeCheck className="h-3 w-3" />
                {L('شريك موثّق', 'Verified partner')}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">{t('common', 'nonPartner', lang)}</Badge>
            )}
            {best && (
              <Badge variant="deal" className="gap-1 text-[10px]">
                <Crown className="h-3 w-3" />
                {t('product', 'bestPrice', lang)}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 shrink-0" />
              {shipping}
            </span>
            <span className={cn('inline-flex items-center gap-1 font-medium', offer.in_stock ? 'text-emerald-800 dark:text-emerald-400' : 'text-red-800 dark:text-red-400')}>
              {offer.in_stock ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
              {offer.in_stock ? t('common', 'inStock', lang) : t('common', 'outOfStock', lang)}
            </span>
          </div>

          {/* freshness: dot + words, never colour alone */}
          <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium', fresh.ring, fresh.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', fresh.dot)} aria-hidden />
            {fresh.label}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
        <div className="text-end">
          <div className={cn('price text-2xl font-bold leading-none', best && 'text-teal-800 dark:text-accent')}>
            {formatEGP(offer.price, lang)}
          </div>
          {best && saving && (
            <span className="mt-1.5 inline-flex items-center rounded-full bg-deal/20 px-2 py-0.5 text-[11px] font-bold text-amber-900 dark:text-deal">
              {L('وفّر', 'You save')} {formatEGP(saving.amount, lang)} ({saving.pct}%)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {canBuy ? (
            <Button
              ref={btnRef}
              size="sm"
              onClick={() => {
                if (addOffer(offer, 1, btnRef.current)) {
                  setAdded(true);
                  window.setTimeout(() => setAdded(false), 1200);
                }
              }}
            >
              {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              {added ? L('اتضاف', 'Added') : t('common', 'addToCart', lang)}
            </Button>
          ) : (
            !partner &&
            shop?.external_url && (
              <Button asChild size="sm" variant="outline">
                <a href={shop.external_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  {t('common', 'visitShop', lang)}
                </a>
              </Button>
            )
          )}
          {!hideDetails && (
            <Button asChild size="sm" variant="ghost">
              <Link href={`/products/${product.id}`}>{t('common', 'viewDetails', lang)}</Link>
            </Button>
          )}
          {onAlert && (
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              onClick={onAlert}
              aria-label={L('نبّهني لو السعر نزل', 'Set price alert')}
              title={L('نبّهني لو السعر نزل', 'Set price alert')}
            >
              <Bell className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // best price: 1.5px gradient border (the wrapper's padding) + soft glow
  return best ? (
    <div className="rounded-md bg-gradient-to-br from-primary via-electric to-deal p-[1.5px] shadow-glow">{row}</div>
  ) : (
    <div className="rounded-md border border-border bg-card shadow-1">{row}</div>
  );
}
