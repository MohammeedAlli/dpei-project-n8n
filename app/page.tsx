'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  Truck,
  Wallet,
  Scale,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/lib/i18n';
import { getCategories, getProducts, type ProductWithMeta } from '@/lib/catalog';
import type { Category } from '@/lib/types';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  microcontrollers: Sparkles,
  arduino: Scale,
  esp: Scale,
  sensors: ShieldCheck,
  motors: Truck,
  plc: ShieldCheck,
  relays: Wallet,
  modules: Sparkles,
  passive: Scale,
  power: Wallet,
};

export default function HomePage() {
  const { lang, dir } = useLanguage();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [products, setProducts] = React.useState<ProductWithMeta[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          getCategories(),
          getProducts({ sort: 'lowest', limit: 8 }),
        ]);
        if (!active) return;
        setCategories(cats);
        setProducts(prods);
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
      {/* Hero */}
      <section className="hero-section">
        <div className="container mx-auto grid gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center gap-5">
            <span className="hero-badge inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
              <RefreshCw className="h-3.5 w-3.5" />
              {lang === 'ar' ? 'الأسعار بتتحدّث باستمرار من المحلات الشريكة' : 'Prices updated continuously from partner shops'}
            </span>
            <h1 className="font-cairo text-4xl font-bold leading-tight md:text-5xl">
              {t('hero', 'title', lang)}
            </h1>
            <p className="hero-subtitle max-w-lg text-base">
              {t('hero', 'subtitle', lang)}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {t('hero', 'cta', lang)}
                  <Arrow className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/assistant">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-foreground/30 bg-transparent text-foreground hover:bg-foreground/10"
                >
                  {t('hero', 'secondaryCta', lang)}
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden items-center justify-end md:flex">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Scale, label: t('home', 'trust1', lang) },
                { icon: Wallet, label: t('home', 'trust2', lang) },
                { icon: Truck, label: t('home', 'trust3', lang) },
                { icon: ShieldCheck, label: t('home', 'trust4', lang) },
              ].map((item, i) => (
                <div
                  key={i}
                  className="hero-card flex h-32 w-44 flex-col justify-center gap-3 rounded-lg p-5 backdrop-blur"
                >
                  <item.icon className="hero-card-icon h-7 w-7" />
                  <span className="hero-card-text text-sm font-medium leading-snug">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-cairo text-2xl font-bold">
            {t('home', 'featuredCategories', lang)}
          </h2>
          <Link
            href="/products"
            className="text-sm font-medium text-accent hover:underline"
          >
            {t('nav', 'products', lang)} →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))
            : categories.map((cat) => {
                const Icon = categoryIcons[cat.slug] ?? Sparkles;
                return (
                  <Link key={cat.id} href={`/products?category=${cat.id}`}>
                    <Card className="flex h-24 flex-col items-center justify-center gap-2 text-center transition-colors hover:border-accent hover:bg-accent/5">
                      <Icon className="h-6 w-6 text-accent" />
                      <span className="text-sm font-medium">
                        {lang === 'ar' ? cat.name_ar : cat.name_en}
                      </span>
                    </Card>
                  </Link>
                );
              })}
        </div>
      </section>

      {/* Featured products */}
      <section className="container mx-auto px-4 py-6 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-cairo text-2xl font-bold">
            {t('home', 'lowestPriceProducts', lang)}
          </h2>
          <Link
            href="/products"
            className="text-sm font-medium text-accent hover:underline"
          >
            {t('nav', 'products', lang)} →
          </Link>
        </div>
        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive">{t('common', 'error', lang)}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
              {t('common', 'tryAgain', lang)}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))
              : products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
