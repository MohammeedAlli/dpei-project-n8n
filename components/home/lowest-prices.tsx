'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { ProductCard, ProductCardSkeleton } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { findSharedImages } from '@/lib/product-images';
import { t } from '@/lib/i18n';
import type { ProductWithMeta } from '@/lib/catalog';

/** Snap-scroll carousel on mobile, 4-column grid from md up. */
export function LowestPrices({
  products,
  allProducts,
  loading,
  error,
}: {
  products: ProductWithMeta[];
  /** full catalogue, used to detect repeated placeholder images */
  allProducts: ProductWithMeta[];
  loading?: boolean;
  error?: boolean;
}) {
  const { lang, dir } = useLanguage();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const shared = React.useMemo(() => findSharedImages(allProducts), [allProducts]);

  const rail =
    '-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ' +
    'md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4';
  const cell = 'w-[68%] min-w-[230px] max-w-[300px] shrink-0 snap-start sm:w-[44%] md:w-auto md:max-w-none';

  return (
    <section className="container pb-16 pt-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold md:text-3xl">{t('home', 'lowestPriceProducts', lang)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === 'ar' ? 'أرخص سعر لكل منتج من المحلات الشريكة' : 'The cheapest price for each product across shops'}
          </p>
        </div>
        <Link
          href="/products?sort=lowest"
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-accent transition-colors hover:border-accent/50 hover:bg-accent/10"
        >
          {lang === 'ar' ? 'عرض الكل' : 'View all'}
          <Arrow className="h-4 w-4 transition-transform duration-base ease-out group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
        </Link>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{t('common', 'error', lang)}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
            {t('common', 'tryAgain', lang)}
          </Button>
        </div>
      ) : (
        <ul className={rail}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <li key={i} className={cell}>
                  <ProductCardSkeleton />
                </li>
              ))
            : products.map((p) => (
                <li key={p.id} className={cell}>
                  <ProductCard product={p} imageIsShared={!!p.image_url && shared.has(p.image_url)} className="h-full" />
                </li>
              ))}
        </ul>
      )}
    </section>
  );
}
