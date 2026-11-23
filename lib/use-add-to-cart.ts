'use client';

import * as React from 'react';
import { useCart } from '@/components/providers/cart-provider';
import { useLanguage } from '@/components/providers/language-provider';
import { useToast } from '@/hooks/use-toast';
import { getProductOffers, type ProductWithMeta } from '@/lib/catalog';
import { flyToCart } from '@/lib/fly-to-cart';
import { t } from '@/lib/i18n';
import type { OfferWithShop } from '@/lib/types';

/** Add-to-cart for a product: picks the cheapest in-stock partner offer, flies to the cart, toasts. */
export function useAddToCart(product: ProductWithMeta) {
  const { lang } = useLanguage();
  const { items, add, setQty, remove } = useCart();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);
  const name = lang === 'ar' ? product.name_ar : product.name_en;
  const line = items.find((i) => i.product_id === product.id) ?? null;

  /** returns true when something was added */
  const addToCart = async (flyFrom?: HTMLElement | null, qty = 1): Promise<boolean> => {
    setBusy(true);
    try {
      const offers = await getProductOffers(product.id);
      const partner = offers.find((o) => o.shop?.is_partner && o.in_stock);
      if (!partner) {
        toast({
          title: t('common', 'noResults', lang),
          description: t('cart', 'partnerOnlyHint', lang),
          variant: 'destructive',
        });
        return false;
      }
      flyToCart(flyFrom ?? null);
      add({
        offer_id: partner.id,
        product_id: product.id,
        shop_id: partner.shop_id,
        shop_name: partner.shop.name,
        product_name_en: product.name_en,
        product_name_ar: product.name_ar,
        unit_price: partner.price,
        in_stock: partner.in_stock,
        quantity: qty,
        image_url: product.image_url,
      });
      toast({ title: t('cart', 'title', lang), description: `${name} × ${qty}` });
      return true;
    } catch {
      toast({ title: t('common', 'error', lang), variant: 'destructive' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const changeQty = (q: number) => {
    if (!line) return;
    if (q <= 0) remove(line.offer_id);
    else setQty(line.offer_id, q);
  };

  return { busy, line, addToCart, changeQty };
}

/** Add one specific offer (compare page / offers tab). */
export function useAddOffer(product: ProductWithMeta) {
  const { lang } = useLanguage();
  const { add } = useCart();
  const { toast } = useToast();
  return (offer: OfferWithShop, qty = 1, flyFrom?: HTMLElement | null) => {
    if (!offer.shop?.is_partner || !offer.in_stock) return false;
    flyToCart(flyFrom ?? null);
    add({
      offer_id: offer.id,
      product_id: product.id,
      shop_id: offer.shop_id,
      shop_name: offer.shop.name,
      product_name_en: product.name_en,
      product_name_ar: product.name_ar,
      unit_price: offer.price,
      in_stock: offer.in_stock,
      quantity: qty,
      image_url: product.image_url,
    });
    toast({ title: t('cart', 'title', lang), description: `${lang === 'ar' ? product.name_ar : product.name_en} × ${qty}` });
    return true;
  };
}

/** Add several products at once (bundle) — cheapest partner offer for each. */
export function useAddMany() {
  const { lang } = useLanguage();
  const { add } = useCart();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);

  const addMany = async (products: ProductWithMeta[]) => {
    setBusy(true);
    let ok = 0;
    const missing: string[] = [];
    try {
      for (const p of products) {
        const offers = await getProductOffers(p.id);
        const o = offers.find((x) => x.shop?.is_partner && x.in_stock);
        if (!o) {
          missing.push(lang === 'ar' ? p.name_ar : p.name_en);
          continue;
        }
        add({
          offer_id: o.id,
          product_id: p.id,
          shop_id: o.shop_id,
          shop_name: o.shop.name,
          product_name_en: p.name_en,
          product_name_ar: p.name_ar,
          unit_price: o.price,
          in_stock: o.in_stock,
          quantity: 1,
          image_url: p.image_url,
        });
        ok++;
      }
      toast({
        title: t('cart', 'title', lang),
        description:
          (lang === 'ar' ? `اتضاف ${ok} منتج` : `${ok} item(s) added`) +
          (missing.length ? (lang === 'ar' ? ` · مش متاح من شريك: ${missing.join('، ')}` : ` · not available from a partner: ${missing.join(', ')}`) : ''),
        variant: ok ? undefined : 'destructive',
      });
    } catch {
      toast({ title: t('common', 'error', lang), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
    return ok;
  };
  return { busy, addMany };
}
