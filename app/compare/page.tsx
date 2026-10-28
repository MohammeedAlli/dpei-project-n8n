'use client';

import * as React from 'react';
import Link from 'next/link';
import { Scale, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { FreshnessBadge, ShopBadge } from '@/components/product-card';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getProducts, getProductOffers, type ProductWithMeta } from '@/lib/catalog';
import type { OfferWithShop } from '@/lib/types';

export default function ComparePage() {
  const { lang, dir } = useLanguage();
  const [products, setProducts] = React.useState<ProductWithMeta[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [offers, setOffers] = React.useState<OfferWithShop[]>([]);
  const [loadingProducts, setLoadingProducts] = React.useState(true);
  const [loadingOffers, setLoadingOffers] = React.useState(false);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getProducts({ sort: 'lowest', limit: 24 });
        if (!active) return;
        setProducts(data);
        if (data[0]) setSelectedId(data[0].id);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoadingProducts(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setLoadingOffers(true);
    (async () => {
      try {
        const off = await getProductOffers(selectedId);
        if (active) setOffers(off);
      } catch {
        /* ignore */
      } finally {
        if (active) setLoadingOffers(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedId]);

  const selected = products.find((p) => p.id === selectedId) || null;
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Scale className="h-6 w-6 text-accent" />
        <h1 className="font-cairo text-2xl font-bold">{t('nav', 'compare', lang)}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          <Input
            placeholder={t('nav', 'search', lang)}
            onChange={(e) => {
              const q = e.target.value;
              getProducts({ search: q, limit: 24 })
                .then(setProducts)
                .catch(() => {});
            }}
            className="h-9"
          />
          <div className="max-h-[60vh] space-y-1 overflow-y-auto">
            {loadingProducts
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)
              : products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-start text-sm transition-colors ${
                      p.id === selectedId
                        ? 'border-accent bg-accent/5'
                        : 'hover:bg-accent/5'
                    }`}
                  >
                    <span className="line-clamp-1">{lang === 'ar' ? p.name_ar : p.name_en}</span>
                    {p.lowest_price !== null && (
                      <span className="shrink-0 text-xs font-medium text-accent">
                        {formatEGP(p.lowest_price, lang)}
                      </span>
                    )}
                  </button>
                ))}
          </div>
        </aside>

        <div>
          {selected ? (
            <Card className="p-6">
              <h2 className="mb-1 font-cairo text-xl font-bold">
                {lang === 'ar' ? selected.name_ar : selected.name_en}
              </h2>
              {selected.brand && (
                <p className="mb-4 text-sm text-muted-foreground">{selected.brand}</p>
              )}

              {loadingOffers ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : offers.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('common', 'noResults', lang)}</p>
              ) : (
                <div className="space-y-2">
                  {offers.map((o, idx) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{o.shop?.name}</span>
                          <ShopBadge isPartner={!!o.shop?.is_partner} />
                          {idx === 0 && (
                            <span className="text-xs font-semibold text-accent">
                              {t('product', 'bestPrice', lang)}
                            </span>
                          )}
                        </div>
                        <FreshnessBadge date={o.last_updated_at} />
                      </div>
                      <div className="text-lg font-bold text-accent">
                        {formatEGP(o.price, lang)}
                      </div>
                    </div>
                  ))}
                  <Link href={`/products/${selected.id}`} className="mt-4 inline-block">
                    <Button variant="outline" size="sm">
                      {t('common', 'viewDetails', lang)}
                      <Arrow className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          ) : (
            <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
              {t('common', 'noResults', lang)}
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-destructive">{t('common', 'error', lang)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
