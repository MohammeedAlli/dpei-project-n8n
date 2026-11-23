'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { ProductCard, ProductCardSkeleton } from '@/components/product-card';
import { FilterPanel, EMPTY_FILTERS, type Filters } from '@/components/products/filter-panel';
import { EmptyState } from '@/components/products/empty-state';
import { BottomSheet } from '@/components/ui/overlay';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCategories, getProducts, type ProductWithMeta } from '@/lib/catalog';
import { findSharedImages } from '@/lib/product-images';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';

type Sort = 'relevance' | 'lowest' | 'highest' | 'newest' | 'offers';
const PAGE = 12;

function ProductsContent() {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const params = useSearchParams();

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [all, setAll] = React.useState<ProductWithMeta[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS);
  const [debouncedQ, setDebouncedQ] = React.useState('');
  const [sort, setSort] = React.useState<Sort>('relevance');
  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  const [sheet, setSheet] = React.useState(false);
  const [visible, setVisible] = React.useState(PAGE);
  const [more, setMore] = React.useState(false);
  const sentinel = React.useRef<HTMLDivElement>(null);

  /* ---- categories once ---- */
  React.useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  /* ---- URL → state (nav search pushes /products?q=…, home links ?category=…&sort=…) ---- */
  const urlQ = params.get('q') ?? '';
  const urlCat = params.get('category');
  const urlSort = params.get('sort');
  React.useEffect(() => {
    const cat = urlCat && urlCat !== 'all' ? categories.find((c) => c.id === urlCat || c.slug === urlCat) : null;
    setFilters((f) => ({ ...f, query: urlQ, categories: urlCat === 'all' ? [] : cat ? [cat.id] : urlCat ? f.categories : [] }));
    if (urlSort === 'lowest' || urlSort === 'highest' || urlSort === 'newest' || urlSort === 'offers') setSort(urlSort);
  }, [urlQ, urlCat, urlSort, categories]);

  /* ---- debounce the text query ---- */
  React.useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(filters.query.trim()), 300);
    return () => clearTimeout(id);
  }, [filters.query]);

  /* ---- fetch (server handles search + stock/partner; the rest is instant, client-side) ---- */
  React.useEffect(() => {
    let live = true;
    setLoading(true);
    setError(false);
    getProducts({
      search: debouncedQ || undefined,
      inStockOnly: filters.inStockOnly,
      partnerOnly: filters.partnerOnly,
      sort: 'relevance',
    })
      .then((d) => live && setAll(d))
      .catch(() => live && setError(true))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [debouncedQ, filters.inStockOnly, filters.partnerOnly]);

  /* ---- derived data ---- */
  const bounds = React.useMemo<[number, number]>(() => {
    const prices = all.map((p) => p.lowest_price).filter((x): x is number => x !== null);
    if (!prices.length) return [0, 0];
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
  }, [all]);

  const passes = React.useCallback(
    (p: ProductWithMeta, skip?: 'category') => {
      if (skip !== 'category' && filters.categories.length && !filters.categories.includes(p.category_id ?? '')) return false;
      if (filters.brands.length && !filters.brands.includes(p.brand ?? '')) return false;
      if (filters.price) {
        const x = p.lowest_price;
        if (x === null || x < filters.price[0] || x > filters.price[1]) return false;
      }
      return true;
    },
    [filters.categories, filters.brands, filters.price]
  );

  const categoryCounts = React.useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of all) if (p.category_id && passes(p, 'category')) m[p.category_id] = (m[p.category_id] ?? 0) + 1;
    return m;
  }, [all, passes]);

  const brands = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const p of all) if (p.brand) m.set(p.brand, (m.get(p.brand) ?? 0) + 1);
    return Array.from(m, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [all]);

  const results = React.useMemo(() => {
    const list = all.filter((p) => passes(p));
    const price = (p: ProductWithMeta) => p.lowest_price ?? Infinity;
    switch (sort) {
      case 'lowest':
        return list.sort((a, b) => price(a) - price(b));
      case 'highest':
        return list.sort((a, b) => (b.lowest_price ?? -1) - (a.lowest_price ?? -1));
      case 'newest':
        return list.sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
      case 'offers':
        return list.sort((a, b) => b.offers_count - a.offers_count || price(a) - price(b));
      default:
        return list;
    }
  }, [all, passes, sort]);

  const shared = React.useMemo(() => findSharedImages(all), [all]);

  /* ---- infinite scroll ---- */
  React.useEffect(() => {
    setVisible(PAGE);
  }, [results.length, sort, view]);

  const shown = results.slice(0, visible);
  const hasMore = visible < results.length;

  React.useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || loading) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || more) return;
        setMore(true);
        window.setTimeout(() => {
          setVisible((v) => v + PAGE);
          setMore(false);
        }, 350);
      },
      { rootMargin: '400px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, more, visible]);

  /* ---- filters helpers ---- */
  const patch = (p: Partial<Filters>) => setFilters((f) => ({ ...f, ...p }));
  const clearAll = () => setFilters(EMPTY_FILTERS);
  const activeCount =
    filters.categories.length +
    filters.brands.length +
    (filters.price ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.partnerOnly ? 1 : 0);
  const hasAny = activeCount > 0 || !!filters.query;
  const catName = (id: string) => {
    const c = categories.find((x) => x.id === id);
    return c ? (lang === 'ar' ? c.name_ar : c.name_en) : id;
  };

  const panel = (
    <FilterPanel
      filters={filters}
      onChange={setFilters}
      categories={categories}
      categoryCounts={categoryCounts}
      brands={brands}
      bounds={bounds}
    />
  );

  return (
    <div className="container py-8 md:py-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">{t('nav', 'products', lang)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {L('قارن الأسعار من كل المحلات في مكان واحد', 'Compare prices across every shop in one place')}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8">
        {/* ------------------------------------------------ sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="glass sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-lg p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-accent" />
                {t('filters', 'title', lang)}
                {activeCount > 0 && (
                  <span className="rounded-full bg-accent px-1.5 py-0.5 font-mono text-[10px] text-accent-foreground">
                    {activeCount}
                  </span>
                )}
              </h2>
              {hasAny && (
                <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 px-2 text-xs">
                  {t('common', 'clear', lang)}
                </Button>
              )}
            </div>
            {panel}
          </div>
        </aside>

        {/* ----------------------------------------------------------- main */}
        <div className="min-w-0 space-y-4">
          {/* search + toolbar */}
          <div className="glass flex flex-col gap-3 rounded-lg p-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={filters.query}
                onChange={(e) => patch({ query: e.target.value })}
                placeholder={t('nav', 'search', lang)}
                className="field h-11 ps-10 pe-9"
              />
              {filters.query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => patch({ query: '' })}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent/10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="relative lg:hidden" onClick={() => setSheet(true)}>
                <SlidersHorizontal className="h-4 w-4" />
                {t('filters', 'title', lang)}
                {activeCount > 0 && (
                  <span className="rounded-full bg-accent px-1.5 font-mono text-[10px] text-accent-foreground">{activeCount}</span>
                )}
              </Button>

              <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                <SelectTrigger className="w-[170px] sm:w-[190px]" aria-label="Sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">{t('sort', 'relevance', lang)}</SelectItem>
                  <SelectItem value="lowest">{t('sort', 'lowestPrice', lang)}</SelectItem>
                  <SelectItem value="highest">{t('sort', 'highestPrice', lang)}</SelectItem>
                  <SelectItem value="newest">{t('sort', 'newest', lang)}</SelectItem>
                  <SelectItem value="offers">{L('الأكثر عروضًا', 'Most offers')}</SelectItem>
                </SelectContent>
              </Select>

              <div className="hidden items-center rounded-sm border border-input p-0.5 sm:flex" role="group" aria-label="View">
                {(['grid', 'list'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={view === v}
                    aria-label={v === 'grid' ? 'Grid view' : 'List view'}
                    onClick={() => setView(v)}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xs transition-colors duration-fast',
                      view === v ? 'bg-accent text-accent-foreground shadow-glow' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {v === 'grid' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* count + active chips */}
          <div className="flex flex-wrap items-center gap-2">
            <p className="me-1 text-sm text-muted-foreground" aria-live="polite">
              {loading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <>
                  <span className="font-mono font-semibold text-foreground">{results.length}</span> {L('منتج', 'products')}
                </>
              )}
            </p>
            {filters.categories.map((id) => (
              <Chip key={id} selected onRemove={() => patch({ categories: filters.categories.filter((x) => x !== id) })} className="h-8 text-xs">
                {catName(id)}
              </Chip>
            ))}
            {filters.brands.map((b) => (
              <Chip key={b} selected onRemove={() => patch({ brands: filters.brands.filter((x) => x !== b) })} className="h-8 text-xs">
                {b}
              </Chip>
            ))}
            {filters.price && (
              <Chip selected onRemove={() => patch({ price: null })} className="h-8 text-xs">
                <span className="price">
                  {formatEGP(filters.price[0], lang)} – {formatEGP(filters.price[1], lang)}
                </span>
              </Chip>
            )}
            {filters.inStockOnly && (
              <Chip selected onRemove={() => patch({ inStockOnly: false })} className="h-8 text-xs">
                {L('المتوفر فقط', 'In stock')}
              </Chip>
            )}
            {filters.partnerOnly && (
              <Chip selected onRemove={() => patch({ partnerOnly: false })} className="h-8 text-xs">
                {L('محلات شريكة', 'Partner shops')}
              </Chip>
            )}
            {hasAny && (
              <button type="button" onClick={clearAll} className="text-xs font-medium text-accent hover:underline">
                {L('مسح الكل', 'Clear all')}
              </button>
            )}
          </div>

          {/* results */}
          {error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-8 text-center">
              <p className="text-sm text-destructive">{t('common', 'error', lang)}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
                {t('common', 'tryAgain', lang)}
              </Button>
            </div>
          ) : loading ? (
            <div className={cn('grid gap-4', view === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1')}>
              {Array.from({ length: 9 }).map((_, i) => (
                <ProductCardSkeleton key={i} view={view} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState onClear={clearAll} hasFilters={hasAny} />
          ) : (
            <>
              <div className={cn('grid gap-4', view === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1')}>
                <AnimatePresence initial={false}>
                  {shown.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      view={view === 'list' ? 'list' : 'grid'}
                      imageIsShared={!!p.image_url && shared.has(p.image_url)}
                    />
                  ))}
                </AnimatePresence>
                {more &&
                  Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={`s${i}`} view={view} />)}
              </div>

              {hasMore ? (
                <div ref={sentinel} className="flex justify-center pt-4">
                  <Button variant="outline" onClick={() => setVisible((v) => v + PAGE)}>
                    {L('عرض المزيد', 'Show more')} ({results.length - visible})
                  </Button>
                </div>
              ) : (
                results.length > PAGE && (
                  <p className="pt-4 text-center text-xs text-muted-foreground">
                    {L('وصلت لآخر النتائج', "You've reached the end")}
                  </p>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* ---------------------------------------------- mobile bottom sheet */}
      <BottomSheet
        open={sheet}
        onClose={() => setSheet(false)}
        title={t('filters', 'title', lang)}
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={clearAll} disabled={!hasAny}>
              {t('common', 'clear', lang)}
            </Button>
            <Button className="flex-[2]" onClick={() => setSheet(false)}>
              {L('عرض', 'Show')} {results.length} {L('منتج', 'products')}
            </Button>
          </div>
        }
      >
        {panel}
      </BottomSheet>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="container py-10">
          <Skeleton className="h-64" />
        </div>
      }
    >
      <ProductsContent />
    </React.Suspense>
  );
}
