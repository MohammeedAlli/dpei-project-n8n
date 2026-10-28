'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, SearchX } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { ProductCard } from '@/components/product-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/lib/i18n';
import { getBrands, getCategories, getProducts, type ProductWithMeta } from '@/lib/catalog';
import type { Category } from '@/lib/types';

function ProductsContent() {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialQuery = searchParams.get('q') || '';

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [brands, setBrands] = React.useState<string[]>([]);
  const [products, setProducts] = React.useState<ProductWithMeta[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const [query, setQuery] = React.useState(initialQuery);
  const [category, setCategory] = React.useState(initialCategory);
  const [brand, setBrand] = React.useState('all');
  const [minPrice, setMinPrice] = React.useState('');
  const [maxPrice, setMaxPrice] = React.useState('');
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [partnerOnly, setPartnerOnly] = React.useState(false);
  const [sort, setSort] = React.useState<'lowest' | 'highest' | 'newest' | 'relevance'>('relevance');

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [cats, brs] = await Promise.all([getCategories(), getBrands()]);
        if (!active) return;
        setCategories(cats);
        setBrands(brs);
      } catch {
        /* non-fatal */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    setCategory(initialCategory);
    setQuery(initialQuery);
  }, [initialCategory, initialQuery]);

  React.useEffect(() => {
    let active = true;
    const handle = setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await getProducts({
          search: query || undefined,
          category: category || undefined,
          brand: brand || undefined,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          inStockOnly,
          partnerOnly,
          sort,
          limit: 60,
        });
        if (!active) return;
        setProducts(data);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query, category, brand, minPrice, maxPrice, inStockOnly, partnerOnly, sort]);

  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setBrand('all');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setPartnerOnly(false);
    setSort('relevance');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-cairo text-2xl font-bold">{t('nav', 'products', lang)}</h1>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">{t('sort', 'relevance', lang)}</SelectItem>
              <SelectItem value="lowest">{t('sort', 'lowestPrice', lang)}</SelectItem>
              <SelectItem value="highest">{t('sort', 'highestPrice', lang)}</SelectItem>
              <SelectItem value="newest">{t('sort', 'newest', lang)}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('all')}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            category === 'all'
              ? 'border-accent bg-accent text-accent-foreground'
              : 'border-border bg-card hover:border-accent hover:bg-accent/5'
          }`}
        >
          {t('common', 'all', lang)}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              category === c.id
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-border bg-card hover:border-accent hover:bg-accent/5'
            }`}
          >
            {lang === 'ar' ? c.name_ar : c.name_en}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{t('filters', 'title', lang)}</h2>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                {t('common', 'clear', lang)}
              </Button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs">{t('nav', 'search', lang)}</Label>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('nav', 'search', lang)}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">{t('filters', 'category', lang)}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common', 'all', lang)}</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {lang === 'ar' ? c.name_ar : c.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">{t('filters', 'brand', lang)}</Label>
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common', 'all', lang)}</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">{t('filters', 'priceRange', lang)}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder={t('filters', 'minPrice', lang)}
                    className="h-9"
                  />
                  <span className="text-muted-foreground">—</span>
                  <Input
                    type="number"
                    min={0}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder={t('filters', 'maxPrice', lang)}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs">{t('filters', 'availability', lang)}</Label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={inStockOnly}
                    onCheckedChange={(v) => setInStockOnly(v === true)}
                  />
                  {t('filters', 'inStockOnly', lang)}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={partnerOnly}
                    onCheckedChange={(v) => setPartnerOnly(v === true)}
                  />
                  {t('filters', 'partnerOnly', lang)}
                </label>
              </div>
            </div>
          </Card>
        </aside>

        {/* Results */}
        <div>
          {error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-8 text-center">
              <p className="text-sm text-destructive">{t('common', 'error', lang)}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
                {t('common', 'tryAgain', lang)}
              </Button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <SearchX className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium">{t('common', 'noResults', lang)}</p>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-3">
                {t('common', 'clear', lang)}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <React.Suspense fallback={<div className="container mx-auto px-4 py-8"><Skeleton className="h-64" /></div>}>
      <ProductsContent />
    </React.Suspense>
  );
}
