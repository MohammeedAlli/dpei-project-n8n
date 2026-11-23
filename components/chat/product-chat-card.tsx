'use client';

import Link from 'next/link';
import { Check, Scale, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { ProductImage } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { formatEGP } from '@/lib/format';
import { useAddToCart } from '@/lib/use-add-to-cart';
import type { ProductWithMeta } from '@/lib/catalog';

/** Rich inline product card inside an assistant message: image, lowest price, Add to Cart, Compare prices. */
export function ProductChatCard({ product, compact }: { product: ProductWithMeta; compact?: boolean }) {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const { addToCart, busy, line } = useAddToCart(product);
  const name = lang === 'ar' ? product.name_ar : product.name_en;
  const inCart = !!line;

  return (
    <div className="flex w-[15.5rem] shrink-0 snap-start flex-col overflow-hidden rounded-md border border-border bg-card shadow-1 transition-shadow hover:shadow-2 sm:w-60">
      <Link href={`/products/${product.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ProductImage product={product} className={compact ? 'aspect-[4/3]' : 'aspect-[4/3]'} />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/products/${product.id}`} className="line-clamp-2 text-sm font-semibold leading-snug hover:text-accent" dir="auto">
          {name}
        </Link>
        <div className="mt-auto">
          {product.lowest_price !== null ? (
            <p className="price text-base font-bold text-accent">
              <span className="text-xs font-normal text-muted-foreground">{L('من ', 'From ')}</span>
              {formatEGP(product.lowest_price, lang)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{L('السعر غير متاح', 'Price unavailable')}</p>
          )}
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button
            size="sm"
            variant={inCart ? 'secondary' : 'default'}
            disabled={busy || product.lowest_price === null}
            onClick={(e) => addToCart(e.currentTarget)}
          >
            {inCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            {inCart ? L('في السلة', 'In cart') : L('أضف للسلة', 'Add to cart')}
          </Button>
          <Button asChild size="sm" variant="outline" aria-label={L('قارن الأسعار', 'Compare prices')} title={L('قارن الأسعار', 'Compare prices')}>
            <Link href={`/compare?id=${product.id}`}><Scale className="h-4 w-4" /></Link>
          </Button>
        </div>
        <Link href={`/compare?id=${product.id}`} className="-mt-1 text-center text-xs font-medium text-muted-foreground underline-offset-2 hover:text-accent hover:underline">
          {L('قارن الأسعار', 'Compare prices')}
        </Link>
      </div>
    </div>
  );
}
