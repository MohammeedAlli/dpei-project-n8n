'use client';

import * as React from 'react';
import { Cpu, TrendingUp, Clock, Store } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getProductOffers } from '@/data/api';
import { formatEGP, formatRelative, isStale } from '@/lib/format';
import { t } from '@/lib/i18n';
import type { ProductWithMeta } from '@/data/types';
import type { OfferWithShop } from '@/data/types';

export function ProductCard({ product }: { product: ProductWithMeta }) {
  const { lang } = useLanguage();
  const { add } = useCart();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);

  const name = lang === 'ar' ? product.name_ar : product.name_en;

  const handleAdd = async () => {
    setBusy(true);
    try {
      const offers = await getProductOffers(product.id);
      const partner = offers.find(
        (o) => o.shop?.is_partner && o.in_stock
      );
      if (!partner) {
        toast({
          title: t('common', 'noResults', lang),
          description: t('cart', 'partnerOnlyHint', lang),
          variant: 'destructive',
        });
        return;
      }
      add({
        offer_id: partner.id,
        product_id: product.id,
        shop_id: partner.shop_id,
        shop_name: partner.shop.name,
        product_name_en: product.name_en,
        product_name_ar: product.name_ar,
        unit_price: partner.price,
        in_stock: partner.in_stock,
        quantity: 1,
        image_url: product.image_url,
      });
      toast({
        title: t('cart', 'title', lang),
        description: `${name} × 1`,
      });
    } catch {
      toast({
        title: t('common', 'error', lang),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <a
        href={`/products/${product.id}`}
        className="flex aspect-square items-center justify-center bg-muted/40 p-6"
      >
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={name}
            className="h-full w-full object-contain transition-transform group-hover:scale-105"
          />
        ) : (
          <Cpu className="h-16 w-16 text-muted-foreground/60" />
        )}
      </a>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          {product.brand && (
            <Badge variant="secondary" className="text-[10px]">
              {product.brand}
            </Badge>
          )}
          {product.category && (
            <span className="text-[11px] text-muted-foreground">
              {lang === 'ar' ? product.category.name_ar : product.category.name_en}
            </span>
          )}
        </div>
        <a
          href={`/products/${product.id}`}
          className="line-clamp-2 text-sm font-medium leading-snug hover:text-accent"
        >
          {name}
        </a>
        {product.sku && (
          <span className="text-[11px] text-muted-foreground">{product.sku}</span>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            {product.lowest_price !== null ? (
              <>
                <div className="flex items-center gap-1 text-base font-bold text-accent">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {formatEGP(product.lowest_price, lang)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t('common', 'from', lang)} · {product.offers_count}{' '}
                  {t('common', 'offers', lang)}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                {t('common', 'noResults', lang)}
              </div>
            )}
          </div>
          {product.lowest_price !== null && (
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={busy}
              className="h-8"
            >
              {busy ? '...' : t('common', 'addToCart', lang)}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function FreshnessBadge({ date, thresholdMinutes = 30 }: { date: string; thresholdMinutes?: number }) {
  const { lang } = useLanguage();
  const stale = isStale(date, thresholdMinutes);
  return (
    <Badge
      variant="outline"
      className={`gap-1 text-[10px] ${
        stale
          ? 'border-destructive/40 text-destructive'
          : 'border-accent/40 text-accent'
      }`}
    >
      <Clock className="h-3 w-3" />
      {formatRelative(date, lang)}
    </Badge>
  );
}

export function ShopBadge({ isPartner }: { isPartner: boolean }) {
  const { lang } = useLanguage();
  return (
    <Badge
      variant={isPartner ? 'default' : 'secondary'}
      className="gap-1 text-[10px]"
    >
      <Store className="h-3 w-3" />
      {isPartner ? t('common', 'partner', lang) : t('common', 'nonPartner', lang)}
    </Badge>
  );
}
