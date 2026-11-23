'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Scale } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { ProductList } from '@/components/compare/product-list';
import { OffersPanel } from '@/components/compare/offers-panel';
import { CompareTray } from '@/components/compare/compare-drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { findSharedImages } from '@/lib/product-images';
import { getProducts, type ProductWithMeta } from '@/lib/catalog';
import { t } from '@/lib/i18n';

function CompareContent() {
  const { lang } = useLanguage();
  const router = useRouter();
  const params = useSearchParams();
  const [products, setProducts] = React.useState<ProductWithMeta[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(params.get('id'));

  React.useEffect(() => {
    let live = true;
    getProducts({ sort: 'relevance' })
      .then((d) => {
        if (!live) return;
        setProducts(d);
        // start on something worth comparing: most offers first
        setSelectedId((cur) => cur ?? [...d].sort((a, b) => b.offers_count - a.offers_count)[0]?.id ?? null);
      })
      .catch(() => live && setError(true))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  const select = (id: string) => {
    setSelectedId(id);
    router.replace(`/compare?id=${id}`, { scroll: false });
  };

  const shared = React.useMemo(() => findSharedImages(products), [products]);
  const selected = products.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="container py-8 md:py-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="icon-well"><Scale className="h-5 w-5" /></span>
        <div>
          <h1 className="font-display text-3xl font-bold">{t('nav', 'compare', lang)}</h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'ar' ? 'اختار منتج وشوف سعره في كل المحلات' : "Pick a product and see its price at every shop"}
          </p>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">{t('common', 'error', lang)}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-8">
          <ProductList products={products} loading={loading} selectedId={selectedId} onSelect={select} shared={shared} />
          <div className="min-w-0" aria-live="polite">
            {loading ? <Skeleton className="h-96 w-full rounded-lg" /> : selected ? <OffersPanel key={selected.id} product={selected} /> : (
              <p className="rounded-md border border-dashed p-12 text-center text-sm text-muted-foreground">{t('common', 'noResults', lang)}</p>
            )}
          </div>
        </div>
      )}
      <CompareTray />
    </div>
  );
}

export default function ComparePage() {
  return (
    <React.Suspense fallback={<div className="container py-10"><Skeleton className="h-96" /></div>}>
      <CompareContent />
    </React.Suspense>
  );
}
