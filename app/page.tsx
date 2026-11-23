'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { CategoryBento } from '@/components/home/category-bento';
import { LowestPrices } from '@/components/home/lowest-prices';
import { Hero } from '@/components/home/hero';
import { t } from '@/lib/i18n';
import { getActiveShops, getCategories, getProducts, type ProductWithMeta } from '@/lib/catalog';
import type { Category } from '@/lib/types';

export default function HomePage() {
  const { lang, dir } = useLanguage();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [products, setProducts] = React.useState<ProductWithMeta[]>([]);
  const [heroProducts, setHeroProducts] = React.useState<ProductWithMeta[]>([]);
  const [productsCount, setProductsCount] = React.useState(0);
  const [shopsCount, setShopsCount] = React.useState(0);
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [cats, prods, shops] = await Promise.all([
          getCategories(),
          getProducts({ sort: 'lowest' }),
          getActiveShops().catch(() => []),
        ]);
        if (!active) return;
        const nextCounts: Record<string, number> = {};
        for (const p of prods) {
          if (!p.category_id) continue;
          nextCounts[p.category_id] = (nextCounts[p.category_id] ?? 0) + 1;
        }
        setCategories(cats);
        setProducts(prods.slice(0, 8));
        setHeroProducts(prods);
        setProductsCount(prods.length);
        setShopsCount(shops.length);
        setCounts(nextCounts);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;
  return (
    <div className="flex flex-col">
      <Hero
        products={heroProducts}
        shopsCount={shopsCount}
        productsCount={productsCount}
        loading={loading}
      />

      <section className="container py-16 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              {t('home', 'featuredCategories', lang)}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {lang === 'ar' ? 'اختار القسم وقارن الأسعار فورًا' : 'Pick a category and compare prices instantly'}
            </p>
          </div>
          <Link
            href="/products"
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-accent transition-colors hover:border-accent/50 hover:bg-accent/10"
          >
            {t('nav', 'products', lang)}
            <Arrow className="h-4 w-4 transition-transform duration-base group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>
        <CategoryBento categories={categories} counts={counts} loading={loading} />
      </section>

      <LowestPrices products={products} allProducts={heroProducts} loading={loading} error={error} />
    </div>
  );
}
