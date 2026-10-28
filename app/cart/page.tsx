'use client';

import * as React from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, ArrowLeft, Truck, Info } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';
import type { CartItem } from '@/lib/types';

const SHOP_DELIVERY_DEFAULT = 40;
const SHOP_FREE_THRESHOLD_DEFAULT = 500;

type ShopGroup = {
  shopId: string;
  shopName: string;
  items: CartItem[];
  subtotal: number;
};

export default function CartPage() {
  const { lang, dir } = useLanguage();
  const { items, remove, setQty, ready } = useCart();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const groups = React.useMemo(() => {
    const map = new Map<string, ShopGroup>();
    for (const item of items) {
      const g = map.get(item.shop_id) ?? {
        shopId: item.shop_id,
        shopName: item.shop_name,
        items: [],
        subtotal: 0,
      };
      g.items.push(item);
      g.subtotal += item.unit_price * item.quantity;
      map.set(item.shop_id, g);
    }
    return Array.from(map.values());
  }, [items]);

  const itemsTotal = groups.reduce((s, g) => s + g.subtotal, 0);
  const deliveryTotal = groups.reduce((s, g) => {
    if (g.subtotal >= SHOP_FREE_THRESHOLD_DEFAULT) return s;
    return s + SHOP_DELIVERY_DEFAULT;
  }, 0);
  const grandTotal = itemsTotal + deliveryTotal;

  if (!ready) {
    return <div className="container mx-auto px-4 py-8" />;
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="mb-2 font-cairo text-xl font-bold">{t('cart', 'empty', lang)}</h1>
          <p className="mb-6 text-sm text-muted-foreground">{t('cart', 'emptyHint', lang)}</p>
          <Link href="/products">
            <Button>
              {lang === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
              <Arrow className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 font-cairo text-2xl font-bold">{t('cart', 'title', lang)}</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {groups.map((group) => {
            const delivery =
              group.subtotal >= SHOP_FREE_THRESHOLD_DEFAULT
                ? 0
                : SHOP_DELIVERY_DEFAULT;
            const remaining = SHOP_FREE_THRESHOLD_DEFAULT - group.subtotal;
            const freeUnlocked = remaining <= 0;
            const progressPct = Math.min(100, (group.subtotal / SHOP_FREE_THRESHOLD_DEFAULT) * 100);

            return (
              <Card key={group.shopId} className="overflow-hidden">
                <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-accent" />
                    <span className="font-medium">{group.shopName}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {t('common', 'partner', lang)}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {group.items.length} {t('common', 'offers', lang)}
                  </span>
                </div>

                <div className="divide-y">
                  {group.items.map((item) => (
                    <div key={item.offer_id} className="flex items-center gap-4 p-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image_url} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <a
                          href={`/products/${item.product_id}`}
                          className="line-clamp-1 text-sm font-medium hover:text-accent"
                        >
                          {lang === 'ar' ? item.product_name_ar : item.product_name_en}
                        </a>
                        <div className="mt-0.5 text-sm text-muted-foreground">
                          {formatEGP(item.unit_price, lang)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setQty(item.offer_id, item.quantity - 1)}
                          aria-label="-"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setQty(item.offer_id, item.quantity + 1)}
                          disabled={item.quantity >= 50}
                          aria-label="+"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="w-20 text-end text-sm font-bold">
                        {formatEGP(item.unit_price * item.quantity, lang)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(item.offer_id)}
                        aria-label={t('cart', 'remove', lang)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="border-t bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('cart', 'subtotal', lang)}</span>
                    <span className="font-medium">{formatEGP(group.subtotal, lang)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('cart', 'delivery', lang)}</span>
                    <span className="font-medium">
                      {delivery === 0 ? (
                        <span className="text-accent">{t('cart', 'free', lang)}</span>
                      ) : (
                        formatEGP(delivery, lang)
                      )}
                    </span>
                  </div>

                  {!freeUnlocked && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Info className="h-3.5 w-3.5" />
                        {t('cart', 'freeProgress', lang).replace(
                          '{amount}',
                          formatEGP(remaining, lang)
                        )}
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold">{t('cart', 'grandTotal', lang)}</h2>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('cart', 'itemsTotal', lang)}</span>
                <span className="font-medium">{formatEGP(itemsTotal, lang)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('cart', 'deliveryTotal', lang)}</span>
                <span className="font-medium">{formatEGP(deliveryTotal, lang)}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>{t('cart', 'grandTotal', lang)}</span>
              <span className="text-accent">{formatEGP(grandTotal, lang)}</span>
            </div>
            <Link href="/checkout" className="block">
              <Button className="w-full" size="lg">
                {t('cart', 'checkout', lang)}
                <Arrow className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/products" className="block text-center text-sm text-muted-foreground hover:text-foreground">
              {t('cart', 'continueShopping', lang)}
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
