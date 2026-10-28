'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Cpu,
  Store,
  ShoppingCart,
  ExternalLink,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useToast } from '@/hooks/use-toast';
import { FreshnessBadge, ShopBadge, ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';
import {
  getProduct,
  getProductOffers,
  getRelatedProducts,
  type ProductWithMeta,
} from '@/lib/catalog';
import type { OfferWithShop } from '@/lib/types';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { lang, dir } = useLanguage();
  const { add } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = React.useState<ProductWithMeta | null>(null);
  const [offers, setOffers] = React.useState<OfferWithShop[]>([]);
  const [related, setRelated] = React.useState<ProductWithMeta[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [addingId, setAddingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    (async () => {
      if (!params.id) return;
      setLoading(true);
      try {
        const [p, off] = await Promise.all([
          getProduct(params.id),
          getProductOffers(params.id),
        ]);
        if (!active) return;
        setProduct(p);
        setOffers(off);
        if (p?.category_id) {
          const rel = await getRelatedProducts(p.id, p.category_id, 4);
          if (active) setRelated(rel);
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [params.id]);

  const handleAdd = (offer: OfferWithShop) => {
    if (!offer.shop?.is_partner) return;
    if (!product) return;
    setAddingId(offer.id);
    add({
      offer_id: offer.id,
      product_id: product.id,
      shop_id: offer.shop_id,
      shop_name: offer.shop.name,
      product_name_en: product.name_en,
      product_name_ar: product.name_ar,
      unit_price: offer.price,
      in_stock: offer.in_stock,
      quantity: 1,
      image_url: product.image_url,
    });
    toast({
      title: t('cart', 'title', lang),
      description: `${lang === 'ar' ? product.name_ar : product.name_en} × 1`,
    });
    setTimeout(() => setAddingId(null), 600);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-6 h-6 w-40" />
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">{t('common', 'noResults', lang)}</p>
        <a href="/products" className="mt-4 inline-block text-accent hover:underline">
          {t('product', 'backToProducts', lang)}
        </a>
      </div>
    );
  }

  const name = lang === 'ar' ? product.name_ar : product.name_en;
  const description = lang === 'ar' ? product.description_ar : product.description_en;
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="container mx-auto px-4 py-8">
      <a
        href="/products"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <BackArrow className="h-4 w-4" />
        {t('product', 'backToProducts', lang)}
      </a>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="flex aspect-square items-center justify-center bg-muted/30 p-8">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={name} className="h-full w-full object-contain" />
          ) : (
            <Cpu className="h-32 w-32 text-muted-foreground/40" />
          )}
        </Card>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {product.brand && <Badge variant="secondary">{product.brand}</Badge>}
            {product.category && (
              <span className="text-xs text-muted-foreground">
                {lang === 'ar' ? product.category.name_ar : product.category.name_en}
              </span>
            )}
          </div>
          <h1 className="font-cairo text-2xl font-bold leading-tight md:text-3xl">{name}</h1>
          {product.sku && (
            <div className="text-sm text-muted-foreground">
              {t('common', 'sku', lang)}: <span className="font-mono">{product.sku}</span>
            </div>
          )}
          {description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}

          {Object.keys(product.specs || {}).length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">{t('common', 'specifications', lang)}</h3>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(product.specs).map(([k, v]) => (
                      <tr key={k} className="border-b last:border-0">
                        <td className="bg-muted/40 p-2.5 font-medium capitalize">{k}</td>
                        <td className="p-2.5">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Offers */}
      <section className="mt-12">
        <h2 className="mb-1 font-cairo text-xl font-bold">
          {t('product', 'shopOffer', lang)}
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t('product', 'offersCount', lang).replace('{count}', String(offers.length))}
        </p>

        {offers.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t('common', 'noResults', lang)}
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((offer, idx) => {
              const isPartner = !!offer.shop?.is_partner;
              return (
                <Card key={offer.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-1 items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Store className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{offer.shop?.name}</span>
                        <ShopBadge isPartner={isPartner} />
                        {idx === 0 && (
                          <Badge variant="outline" className="gap-1 border-accent/40 text-accent text-[10px]">
                            <TrendingUp className="h-3 w-3" />
                            {t('product', 'bestPrice', lang)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          {offer.in_stock ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                              {t('common', 'inStock', lang)}
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5 text-destructive" />
                              {t('common', 'outOfStock', lang)}
                            </>
                          )}
                        </span>
                        {isPartner && offer.shop?.delivery_days_text && (
                          <span>{offer.shop.delivery_days_text}</span>
                        )}
                        <FreshnessBadge date={offer.last_updated_at} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-end">
                      <div className="text-lg font-bold text-accent">
                        {formatEGP(offer.price, lang)}
                      </div>
                    </div>
                    {isPartner ? (
                      <Button
                        size="sm"
                        disabled={!offer.in_stock || addingId === offer.id}
                        onClick={() => handleAdd(offer)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {addingId === offer.id ? '...' : t('common', 'addToCart', lang)}
                      </Button>
                    ) : (
                      offer.shop?.external_url && (
                        <Button asChild size="sm" variant="outline">
                          <a href={offer.shop.external_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            {t('common', 'visitShop', lang)}
                          </a>
                        </Button>
                      )
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <Separator className="mb-8" />
          <h2 className="mb-4 font-cairo text-xl font-bold">
            {t('product', 'relatedProducts', lang)}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
