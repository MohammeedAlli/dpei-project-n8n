'use client';

import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Clock, Eye, Heart, Minus, Plus, ShoppingCart, Store, Check } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryArt, categoryKey } from '@/components/category-art';
import { QuickView } from '@/components/quick-view';
import { formatEGP, formatRelative, isStale } from '@/lib/format';
import { t } from '@/lib/i18n';
import { useOfferSummary } from '@/lib/offers-summary';
import { isPlaceholderUrl } from '@/lib/product-images';
import { useAddToCart } from '@/lib/use-add-to-cart';
import { useWishlist } from '@/lib/wishlist';
import { cn } from '@/lib/utils';
import type { ProductWithMeta } from '@/lib/catalog';

/* ------------------------------------------------------------- image area */

export function ProductImage({
  product,
  shared,
  className,
  imgRef,
}: {
  product: ProductWithMeta;
  /** this image_url is reused by many products → treat as placeholder */
  shared?: boolean;
  className?: string;
  imgRef?: React.Ref<HTMLDivElement>;
}) {
  const { lang } = useLanguage();
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const name = lang === 'ar' ? product.name_ar : product.name_en;
  const useFallback = !product.image_url || failed || shared || isPlaceholderUrl(product.image_url);
  const kind = categoryKey(product.category);

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative aspect-square w-full overflow-hidden bg-gradient-to-br from-muted via-card to-accent/10',
        className
      )}
    >
      {useFallback ? (
        // category illustration instead of one repeated stock photo
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute h-3/5 w-3/5 rounded-full bg-accent/15 blur-2xl" />
          <CategoryArt
            kind={kind}
            className="relative h-1/2 w-1/2 text-foreground/70 transition-transform duration-slow ease-out group-hover:scale-110 group-hover:-rotate-3"
          />
        </div>
      ) : (
        <>
          {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url!}
            alt={name}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn(
              'absolute inset-0 h-full w-full object-contain p-5 transition-[transform,opacity] duration-slow ease-out',
              'group-hover:scale-[1.06]',
              loaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- sparkline */

/** Tiny line of the prices different shops charge (cheapest highlighted). */
function Sparkline({ prices }: { prices: number[] }) {
  if (prices.length < 2 || prices[0] === prices[prices.length - 1]) return null;
  const w = 56;
  const h = 18;
  const min = prices[0];
  const max = prices[prices.length - 1];
  const pts = prices.map((p, i) => [(i / (prices.length - 1)) * (w - 4) + 2, h - 3 - ((p - min) / (max - min)) * (h - 6)]);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="shrink-0 text-accent" aria-hidden>
      <polyline
        points={pts.map((p) => p.join(',')).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".7"
      />
      <circle cx={pts[0][0]} cy={pts[0][1]} r="2.6" fill="currentColor" />
    </svg>
  );
}

function ShopAvatars({ shops }: { shops: { name: string; logo_url: string | null }[] }) {
  if (!shops.length) return null;
  const shown = shops.slice(0, 3);
  return (
    <span className="flex items-center -space-x-1.5 rtl:space-x-reverse">
      {shown.map((s) => (
        <span
          key={s.name}
          title={s.name}
          className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border-2 border-card bg-muted text-[9px] font-bold uppercase text-muted-foreground"
        >
          {s.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.logo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            s.name.trim().charAt(0)
          )}
        </span>
      ))}
      {shops.length > 3 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-accent/15 px-1 text-[9px] font-bold text-accent">
          +{shops.length - 3}
        </span>
      )}
    </span>
  );
}

/* -------------------------------------------------------------- add / qty */

export function CartControl({
  product,
  flyFrom,
  size = 'sm',
  className,
}: {
  product: ProductWithMeta;
  flyFrom?: React.RefObject<HTMLElement>;
  size?: 'sm' | 'default';
  className?: string;
}) {
  const { lang } = useLanguage();
  const { busy, line, addToCart, changeQty } = useAddToCart(product);
  const h = size === 'sm' ? 'h-9' : 'h-11';

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait" initial={false}>
        {line ? (
          <motion.div
            key="stepper"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.16 }}
            className={cn(
              'flex w-full items-center justify-between rounded-sm border border-accent/50 bg-accent/10 shadow-glow',
              h
            )}
          >
            <button
              type="button"
              onClick={() => changeQty(line.quantity - 1)}
              aria-label="−"
              className={cn('flex w-10 items-center justify-center rounded-s-sm text-accent hover:bg-accent/15', h)}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="flex items-center gap-1 font-mono text-sm font-bold">
              <Check className="h-3.5 w-3.5 text-success" />
              {line.quantity}
            </span>
            <button
              type="button"
              onClick={() => changeQty(line.quantity + 1)}
              aria-label="+"
              className={cn('flex w-10 items-center justify-center rounded-e-sm text-accent hover:bg-accent/15', h)}
            >
              <Plus className="h-4 w-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="add"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.16 }}
          >
            <Button
              size={size}
              disabled={busy}
              onClick={() => addToCart(flyFrom?.current)}
              className="w-full"
            >
              <ShoppingCart className="h-4 w-4" />
              {busy ? '…' : t('common', 'addToCart', lang)}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ card */

export interface ProductCardProps {
  product: ProductWithMeta;
  view?: 'grid' | 'list';
  /** set from findSharedImages(list) to hide a repeated stock photo */
  imageIsShared?: boolean;
  className?: string;
}

export function ProductCard({ product, view = 'grid', imageIsShared, className }: ProductCardProps) {
  const { lang } = useLanguage();
  const { liked, toggle } = useWishlist(product.id);
  const summary = useOfferSummary(product.id);
  const imageRef = React.useRef<HTMLDivElement>(null);
  const [quick, setQuick] = React.useState(false);
  const reduce = useReducedMotion();

  const name = lang === 'ar' ? product.name_ar : product.name_en;
  const catName = product.category ? (lang === 'ar' ? product.category.name_ar : product.category.name_en) : null;
  const href = `/products/${product.id}`;
  const hasPrice = product.lowest_price !== null;
  const compared = product.offers_count > 1;
  const list = view === 'list';

  return (
    <>
      <motion.article
        layout="position"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={reduce ? undefined : { y: -4 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'group relative overflow-hidden rounded-md border bg-card shadow-2',
          'transition-[box-shadow,border-color] duration-base ease-out',
          'hover:border-accent/50 hover:shadow-glow',
          list ? 'flex flex-row' : 'flex flex-col',
          className
        )}
      >
        {/* image */}
        <div className={cn('relative shrink-0', list ? 'w-36 sm:w-48' : 'w-full')}>
          <Link href={href} aria-label={name} className="block">
            <ProductImage product={product} shared={imageIsShared} imgRef={imageRef} />
          </Link>

          {compared && hasPrice && (
            <Badge variant="deal" className="absolute start-3 top-3 px-2 text-[10px]">
              {t('product', 'bestPrice', lang)}
            </Badge>
          )}

          {/* wishlist */}
          <motion.button
            type="button"
            onClick={toggle}
            whileTap={{ scale: 0.8 }}
            aria-pressed={liked}
            aria-label="Wishlist"
            className="absolute end-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur transition-colors hover:border-destructive/40"
          >
            <motion.span
              key={String(liked)}
              initial={{ scale: liked ? 0.4 : 1 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 600, damping: 12 }}
              className="flex"
            >
              <Heart className={cn('h-4 w-4', liked ? 'fill-destructive text-destructive' : 'text-muted-foreground')} />
            </motion.span>
          </motion.button>

          {/* quick view */}
          <button
            type="button"
            onClick={() => setQuick(true)}
            aria-label="Quick view"
            className={cn(
              'absolute end-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-2 backdrop-blur',
              'transition-[opacity,transform,background-color] duration-base ease-out hover:bg-accent hover:text-accent-foreground',
              'sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100'
            )}
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>

        {/* body */}
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {catName && (
              <span className="inline-flex max-w-full items-center truncate rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                {catName}
              </span>
            )}
            {product.brand && <span className="truncate text-[11px] text-muted-foreground">{product.brand}</span>}
          </div>

          <Link
            href={href}
            className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug transition-colors hover:text-accent"
          >
            {name}
          </Link>

          {/* stock */}
          {summary && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  summary.inStock ? 'bg-success shadow-[0_0_8px_hsl(var(--success)/.7)]' : 'bg-destructive'
                )}
              />
              <span className={summary.inStock ? 'text-success' : 'text-destructive'}>
                {summary.inStock ? t('common', 'inStock', lang) : t('common', 'outOfStock', lang)}
              </span>
            </span>
          )}

          <div className="mt-auto space-y-2.5 pt-1">
            {hasPrice ? (
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <div className="price text-lg font-bold leading-none text-foreground">
                    {formatEGP(product.lowest_price!, lang)}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>
                      {t('common', 'from', lang)} {product.offers_count} {t('common', 'offers', lang)}
                    </span>
                    {summary && <ShopAvatars shops={summary.shops} />}
                  </div>
                </div>
                {summary && <Sparkline prices={summary.prices} />}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">{t('common', 'noResults', lang)}</div>
            )}

            {hasPrice && <CartControl product={product} flyFrom={imageRef} />}
          </div>
        </div>
      </motion.article>

      <QuickView product={product} open={quick} onClose={() => setQuick(false)} imageIsShared={imageIsShared} />
    </>
  );
}

/** Skeleton with the same footprint as ProductCard (no layout shift). */
export function ProductCardSkeleton({ view = 'grid' }: { view?: 'grid' | 'list' }) {
  return (
    <div className={cn('overflow-hidden rounded-md border bg-card', view === 'list' ? 'flex' : 'flex flex-col')}>
      <Skeleton className={cn('aspect-square rounded-none', view === 'list' ? 'w-36 sm:w-48' : 'w-full')} />
      <div className="flex-1 space-y-3 p-4">
        <Skeleton className="h-4 w-1/3 rounded-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-4 h-6 w-1/2" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}

/* ----------------------------------------- existing exports (used elsewhere) */

export function FreshnessBadge({ date, thresholdMinutes = 30 }: { date: string; thresholdMinutes?: number }) {
  const { lang } = useLanguage();
  const stale = isStale(date, thresholdMinutes);
  return (
    <Badge variant={stale ? 'destructive' : 'default'} className="gap-1 text-[10px]">
      <Clock className="h-3 w-3" />
      {formatRelative(date, lang)}
    </Badge>
  );
}

export function ShopBadge({ isPartner }: { isPartner: boolean }) {
  const { lang } = useLanguage();
  return (
    <Badge variant={isPartner ? 'default' : 'secondary'} className="gap-1 text-[10px]">
      <Store className="h-3 w-3" />
      {isPartner ? t('common', 'partner', lang) : t('common', 'nonPartner', lang)}
    </Badge>
  );
}
