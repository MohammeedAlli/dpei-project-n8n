'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Banknote, Download, FileSearch, Tag, Truck } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { ProductCard } from '@/components/product-card';
import { CompareTray } from '@/components/compare/compare-drawer';
import { OfferRow } from '@/components/compare/offer-row';
import { PriceBars } from '@/components/compare/price-bars';
import { PriceAlertDialog } from '@/components/compare/alert-dialog';
import { savingFor } from '@/components/compare/offers-panel';
import { categoryKey } from '@/components/category-art';
import { Gallery } from '@/components/product/gallery';
import { BuyBox } from '@/components/product/buy-box';
import { Bundle } from '@/components/product/bundle';
import { SimpleTabs } from '@/components/ui/simple-tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { findComplements } from '@/lib/bundles';
import { isPlaceholderUrl } from '@/lib/product-images';
import { getShopLogos } from '@/lib/price-data';
import { t } from '@/lib/i18n';
import {
  getProduct,
  getProductOffers,
  getProducts,
  getRelatedProducts,
  type ProductWithMeta,
} from '@/lib/catalog';
import type { OfferWithShop } from '@/lib/types';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { lang, dir } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const [product, setProduct] = React.useState<ProductWithMeta | null>(null);
  const [offers, setOffers] = React.useState<OfferWithShop[]>([]);
  const [related, setRelated] = React.useState<ProductWithMeta[]>([]);
  const [complements, setComplements] = React.useState<ProductWithMeta[]>([]);
  const [logos, setLogos] = React.useState<Map<string, string | null>>(new Map());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [alertOpen, setAlertOpen] = React.useState(false);

  React.useEffect(() => {
    let live = true;
    (async () => {
      if (!params.id) return;
      setLoading(true);
      setError(false);
      try {
        const [p, off] = await Promise.all([getProduct(params.id), getProductOffers(params.id)]);
        if (!live) return;
        setProduct(p);
        setOffers(off);
        setLoading(false);
        getShopLogos().then((m) => live && setLogos(m));
        if (p) {
          // secondary content loads after the main view is on screen
          const [rel, catalogue] = await Promise.all([
            p.category_id ? getRelatedProducts(p.id, p.category_id, 4) : Promise.resolve([]),
            getProducts({ sort: 'lowest' }).catch(() => []),
          ]);
          if (!live) return;
          setRelated(rel);
          setComplements(findComplements(p, catalogue, 2));
        }
      } catch {
        if (live) {
          setError(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      live = false;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="mb-6 h-5 w-40" />
        <div className="grid gap-8 lg:grid-cols-12">
          <Skeleton className="aspect-square rounded-lg lg:col-span-7" />
          <div className="space-y-4 lg:col-span-5">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-20 text-center">
        <p className="text-sm text-muted-foreground">{t('common', 'noResults', lang)}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/products">{t('product', 'backToProducts', lang)}</Link>
        </Button>
      </div>
    );
  }

  const name = lang === 'ar' ? product.name_ar : product.name_en;
  const description = lang === 'ar' ? product.description_ar : product.description_en;
  const catName = product.category ? (lang === 'ar' ? product.category.name_ar : product.category.name_en) : null;
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const specs = Object.entries(product.specs ?? {});
  const kind = categoryKey(product.category);
  const images = product.image_url && !isPlaceholderUrl(product.image_url) ? [product.image_url] : [];
  const saving = savingFor(offers);

  // datasheet: a real link if the specs hold one, otherwise a search for it
  const dsEntry = specs.find(([k, v]) => /datasheet|data_sheet|pdf/i.test(k) && /^https?:\/\//i.test(v));
  const dsSearch = `https://www.google.com/search?q=${encodeURIComponent(`${product.sku || product.name_en} datasheet filetype:pdf`)}`;

  const trust = [
    { icon: Banknote, title: t('home', 'trust4', lang), desc: t('home', 'trust4Desc', lang) },
    { icon: Truck, title: t('home', 'trust3', lang), desc: t('home', 'trust3Desc', lang) },
    { icon: Tag, title: t('home', 'trust2', lang), desc: t('home', 'trust2Desc', lang) },
  ];

  return (
    <div className="container py-6 md:py-8">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/products" className="inline-flex items-center gap-1 hover:text-foreground">
          <BackArrow className="h-4 w-4" />
          {t('product', 'backToProducts', lang)}
        </Link>
        {catName && (
          <>
            <span aria-hidden>/</span>
            <Link href={`/products?category=${product.category_id}`} className="hover:text-foreground">{catName}</Link>
          </>
        )}
      </nav>

      {/* ------------------------------------------- gallery + buy box */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
        <div className="lg:col-span-7">
          <Gallery images={images} alt={name} kind={kind} />
        </div>

        <div className="space-y-5 lg:sticky lg:top-24 lg:col-span-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {catName && <Badge variant="default">{catName}</Badge>}
              {product.brand && <Badge variant="secondary">{product.brand}</Badge>}
              {product.sku && <Badge variant="mono">{product.sku}</Badge>}
            </div>
            <h1 className="font-display text-2xl font-bold leading-tight md:text-3xl">{name}</h1>
          </div>
          <BuyBox product={product} offers={offers} onAlert={() => setAlertOpen(true)} />
        </div>
      </div>

      {/* ------------------------------------------------- trust row */}
      <ul className="mt-8 grid gap-3 sm:grid-cols-3">
        {trust.map((x) => (
          <li key={x.title} className="flex items-center gap-3 rounded-md border border-border bg-card/70 p-4 transition-[transform,box-shadow] duration-base hover:-translate-y-0.5 hover:shadow-glow">
            <span className="icon-well shrink-0"><x.icon className="h-5 w-5" strokeWidth={1.75} /></span>
            <span>
              <span className="block text-sm font-semibold">{x.title}</span>
              <span className="block text-xs text-muted-foreground">{x.desc}</span>
            </span>
          </li>
        ))}
      </ul>

      {/* --------------------------------------------------- bundle */}
      {complements.length > 0 && (
        <div className="mt-10">
          <Bundle product={product} complements={complements} />
        </div>
      )}

      {/* ----------------------------------------------------- tabs */}
      <div className="mt-12">
        <SimpleTabs
          label={L('تفاصيل المنتج', 'Product details')}
          tabs={[
            {
              id: 'overview',
              label: L('نظرة عامة', 'Overview'),
              content: (
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4">
                    {description ? (
                      <p className="max-w-prose text-base leading-relaxed text-foreground/90">{description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">{L('مفيش وصف لسه للمنتج ده.', 'No description yet for this product.')}</p>
                    )}
                  </div>
                  {specs.length > 0 && (
                    <dl className="space-y-2 rounded-md border border-border bg-card p-4">
                      {specs.slice(0, 5).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 text-sm">
                          <dt className="capitalize text-muted-foreground">{k.replace(/_/g, ' ')}</dt>
                          <dd className="font-mono text-xs font-semibold">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              ),
            },
            {
              id: 'specs',
              label: t('common', 'specifications', lang),
              content:
                specs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{L('مفيش مواصفات متسجّلة.', 'No specifications on record.')}</p>
                ) : (
                  <div className="overflow-hidden rounded-md border border-border">
                    <table className="w-full text-sm">
                      <caption className="sr-only">{t('common', 'specifications', lang)}</caption>
                      <tbody>
                        {specs.map(([k, v], i) => (
                          <tr key={k} className={i % 2 ? 'bg-muted/30' : 'bg-card'}>
                            <th scope="row" className="w-2/5 p-3 text-start font-medium capitalize text-muted-foreground">{k.replace(/_/g, ' ')}</th>
                            <td className="p-3 font-mono text-[13px]">{v}</td>
                          </tr>
                        ))}
                        {product.sku && (
                          <tr className={specs.length % 2 ? 'bg-muted/30' : 'bg-card'}>
                            <th scope="row" className="p-3 text-start font-medium text-muted-foreground">{t('common', 'sku', lang)}</th>
                            <td className="p-3 font-mono text-[13px]">{product.sku}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ),
            },
            {
              id: 'offers',
              label: (
                <>
                  {L('العروض', 'Offers')}{' '}
                  <span className="ms-1 rounded-full bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] text-teal-800 dark:text-accent">{offers.length}</span>
                </>
              ),
              content: (
                <div className="space-y-5">
                  {offers.length === 0 ? (
                    <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">{t('common', 'noResults', lang)}</p>
                  ) : (
                    <ul className="space-y-3">
                      {offers.map((o, i) => (
                        <li key={o.id}>
                          <OfferRow offer={o} product={product} best={i === 0} saving={i === 0 ? saving : null} logo={logos.get(o.shop_id)} onAlert={() => setAlertOpen(true)} hideDetails />
                        </li>
                      ))}
                    </ul>
                  )}
                  {offers.length >= 2 && (
                    <div className="rounded-md border border-border bg-card p-5">
                      <PriceBars offers={offers} />
                    </div>
                  )}
                  <Button asChild variant="outline">
                    <Link href={`/compare?id=${product.id}`}>{L('افتح في مقارنة الأسعار (مع تاريخ السعر)', 'Open in price comparison (with history)')}</Link>
                  </Button>
                </div>
              ),
            },
            {
              id: 'datasheet',
              label: L('الداتا شيت', 'Datasheet'),
              content: (
                <div className="flex max-w-xl flex-col items-start gap-4 rounded-md border border-border bg-card p-6">
                  {dsEntry ? (
                    <>
                      <p className="text-sm text-muted-foreground">{L('ملف الداتا شيت الرسمي للمنتج.', 'Official datasheet for this product.')}</p>
                      <Button asChild>
                        <a href={dsEntry[1]} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4" />
                          {L('تحميل الداتا شيت (PDF)', 'Download datasheet (PDF)')}
                        </a>
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {L('لسه مفيش ملف داتا شيت مرفوع للمنتج ده. تقدر تدوّر عليه:', "No datasheet file has been uploaded for this product yet. You can search for it:")}
                      </p>
                      <Button asChild variant="outline">
                        <a href={dsSearch} target="_blank" rel="noopener noreferrer">
                          <FileSearch className="h-4 w-4" />
                          {L('دوّر على الداتا شيت', 'Search for the datasheet')}
                        </a>
                      </Button>
                    </>
                  )}
                </div>
              ),
            },
            {
              id: 'related',
              label: t('product', 'relatedProducts', lang),
              content:
                related.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('common', 'noResults', lang)}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {related.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                ),
            },
          ]}
        />
      </div>

      <PriceAlertDialog product={product} open={alertOpen} onClose={() => setAlertOpen(false)} currentBest={offers[0]?.price ?? null} />
      <CompareTray />
    </div>
  );
}
