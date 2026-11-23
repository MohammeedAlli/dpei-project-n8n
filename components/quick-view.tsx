'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Modal } from '@/components/ui/overlay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductImage, CartControl, ShopBadge } from '@/components/product-card';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getProductOffers, type ProductWithMeta } from '@/lib/catalog';
import type { OfferWithShop } from '@/lib/types';

export function QuickView({
  product,
  open,
  onClose,
  imageIsShared,
}: {
  product: ProductWithMeta;
  open: boolean;
  onClose: () => void;
  imageIsShared?: boolean;
}) {
  const { lang, dir } = useLanguage();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const imgRef = React.useRef<HTMLDivElement>(null);
  const [offers, setOffers] = React.useState<OfferWithShop[] | null>(null);
  const name = lang === 'ar' ? product.name_ar : product.name_en;
  const desc = lang === 'ar' ? product.description_ar : product.description_en;

  React.useEffect(() => {
    if (!open || offers) return;
    let live = true;
    getProductOffers(product.id)
      .then((o) => live && setOffers(o))
      .catch(() => live && setOffers([]));
    return () => {
      live = false;
    };
  }, [open, offers, product.id]);

  return (
    <Modal open={open} onClose={onClose} label={name}>
      <div className="grid gap-0 sm:grid-cols-2">
        <ProductImage product={product} shared={imageIsShared} imgRef={imgRef} className="sm:rounded-s-lg" />
        <div className="flex flex-col gap-3 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 pe-10">
            {product.brand && <Badge variant="secondary">{product.brand}</Badge>}
            {product.sku && <Badge variant="mono">{product.sku}</Badge>}
          </div>
          <h2 className="font-display text-xl font-bold leading-snug">{name}</h2>
          {desc && <p className="line-clamp-3 text-sm text-muted-foreground">{desc}</p>}

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">
              {t('product', 'offersCount', lang).replace('{count}', String(offers?.length ?? product.offers_count))}
            </p>
            {!offers ? (
              <div className="flex justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              offers.slice(0, 4).map((o, i) => (
                <div key={o.id} className="flex items-center justify-between gap-2 rounded-sm border border-border bg-card/60 px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <span className="truncate font-medium">{o.shop?.name}</span>
                    <ShopBadge isPartner={!!o.shop?.is_partner} />
                  </span>
                  <span className="flex items-center gap-1.5">
                    {i === 0 && <Badge variant="deal" className="px-1.5 text-[9px]">{t('product', 'bestPrice', lang)}</Badge>}
                    <span className="price text-sm font-bold">{formatEGP(o.price, lang)}</span>
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto space-y-2 pt-2">
            {product.lowest_price !== null && <CartControl product={product} flyFrom={imgRef} size="default" />}
            <Button asChild variant="outline" className="group w-full" onClick={onClose}>
              <Link href={`/products/${product.id}`}>
                {t('common', 'viewDetails', lang)}
                <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
