'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MotionConfig, motion, useInView, type Variants } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  BadgeCheck,
  Tag,
  Truck,
  Banknote,
  Store,
  Boxes,
  Activity,
  Search,
} from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { SearchBox } from '@/components/search-box';
import { HeroBackground } from '@/components/home/hero-background';
import { HeroVisual } from '@/components/home/hero-visual';
import { CountUp } from '@/components/home/count-up';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { t } from '@/lib/i18n';
import type { ProductWithMeta } from '@/lib/catalog';

const ease = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const QUICK = [
  { q: 'Arduino', ar: 'Arduino', en: 'Arduino' },
  { q: 'ESP32', ar: 'ESP32', en: 'ESP32' },
  { q: 'Raspberry Pi', ar: 'Raspberry Pi', en: 'Raspberry Pi' },
  { q: 'sensor', ar: 'حساسات', en: 'Sensors' },
];

/** prefer recognisable maker boards for the floating price cards */
function pickShowcase(products: ProductWithMeta[]) {
  const priced = products.filter((p) => p.lowest_price !== null && p.lowest_price > 0);
  const preferred = priced.filter((p) => /arduino|esp|raspberry|uno|nano|sensor|حساس/i.test(`${p.name_en} ${p.name_ar}`));
  return (preferred.length >= 3 ? preferred : priced).slice(0, 9);
}

export interface HeroProps {
  products: ProductWithMeta[];
  shopsCount: number;
  productsCount: number;
  loading?: boolean;
}

export function Hero({ products, shopsCount, productsCount, loading }: HeroProps) {
  const { lang, dir } = useLanguage();
  const router = useRouter();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const showcase = React.useMemo(() => pickShowcase(products), [products]);

  return (
    <MotionConfig reducedMotion="user">
      <section className="hero-section z-[11]" style={{ overflow: 'visible', overflowX: 'clip' }}>
        <HeroBackground />

        <div className="container relative z-[2] grid items-center gap-12 pb-20 pt-12 md:pt-16 lg:grid-cols-12 lg:gap-8 lg:pb-24 lg:pt-20">
          {/* ------------------------------------------------ copy side */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-6 lg:col-span-7"
          >
            <motion.span
              variants={item}
              className="glass inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium"
            >
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-success" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              {lang === 'ar' ? 'أسعار مباشرة من المحلات الشريكة' : 'Live prices from partner shops'}
            </motion.span>

            <motion.h1
              variants={item}
              className="font-display text-hero font-bold ltr:leading-[1.04] rtl:leading-[1.3]"
            >
              <span dir="ltr" className="inline-block">
                Electro <span className="text-shimmer">Hub</span>
              </span>
            </motion.h1>

            <motion.p variants={item} className="hero-subtitle max-w-[52ch]">
              {t('hero', 'subtitle', lang)}
            </motion.p>

            <motion.div variants={item} className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="btn-shine group">
                <Link href="/products">
                  {t('hero', 'cta', lang)}
                  <Arrow className="h-4 w-4 transition-transform duration-base ease-out group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="group bg-background/40 backdrop-blur">
                <Link href="/assistant">
                  <Sparkles className="h-4 w-4 text-accent transition-transform duration-base ease-spring group-hover:rotate-12 group-hover:scale-125" />
                  {t('hero', 'secondaryCta', lang)}
                </Link>
              </Button>
            </motion.div>

            <motion.div variants={item} className="max-w-xl">
              <SearchBox variant="hero" />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {lang === 'ar' ? 'الأكثر بحثًا:' : 'Popular:'}
                </span>
                {QUICK.map((c, i) => (
                  <motion.span
                    key={c.q}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + i * 0.07, type: 'spring', stiffness: 380, damping: 20 }}
                  >
                    <Chip
                      icon={<Search />}
                      onClick={() => router.push(`/products?q=${encodeURIComponent(c.q)}`)}
                      className="h-8 text-[13px]"
                    >
                      {lang === 'ar' ? c.ar : c.en}
                    </Chip>
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* ----------------------------------------------- visual side */}
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
          >
            <HeroVisual products={showcase} loading={loading} />
          </motion.div>
        </div>
      </section>

      <TrustBar />
      <StatsRow shopsCount={shopsCount} productsCount={productsCount} />
    </MotionConfig>
  );
}

/* ------------------------------------------------------------- trust bar */

function TrustBar() {
  const { lang } = useLanguage();
  const points = [
    { icon: BadgeCheck, title: t('home', 'trust1', lang), desc: t('home', 'trust1Desc', lang) },
    { icon: Tag, title: t('home', 'trust2', lang), desc: t('home', 'trust2Desc', lang) },
    { icon: Truck, title: t('home', 'trust3', lang), desc: t('home', 'trust3Desc', lang) },
    { icon: Banknote, title: t('home', 'trust4', lang), desc: t('home', 'trust4Desc', lang) },
  ];
  return (
    <div className="container relative z-10 mt-2">
      <motion.ul
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        className="glass grid grid-cols-1 gap-1 rounded-lg p-2 sm:grid-cols-2 lg:grid-cols-4"
      >
        {points.map((p) => (
          <motion.li
            key={p.title}
            variants={item}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            className="group flex items-center gap-3.5 rounded-md p-4 transition-colors duration-base hover:bg-accent/10"
          >
            <span className="icon-well shrink-0 transition-shadow duration-base group-hover:shadow-glow">
              <p.icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-snug">{p.title}</span>
              <span className="block text-xs leading-snug text-muted-foreground">{p.desc}</span>
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

/* ------------------------------------------------------------- stats row */

function StatsRow({ shopsCount, productsCount }: { shopsCount: number; productsCount: number }) {
  const { lang } = useLanguage();
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const nf = (n: number) => Math.round(n).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US');
  // "280+" rather than a falsely precise 287
  const roundedProducts = productsCount >= 50 ? Math.floor(productsCount / 10) * 10 : productsCount;

  const stats = [
    { icon: Store, value: shopsCount, label: lang === 'ar' ? 'محل شريك' : 'partner shops' },
    { icon: Boxes, value: roundedProducts, label: lang === 'ar' ? 'منتج' : 'products' },
  ];

  return (
    <div ref={ref} className="container py-12 md:py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-stretch justify-center divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-1 flex-col items-center gap-1 px-6 py-4 text-center">
            <s.icon className="mb-1 h-5 w-5 text-accent" strokeWidth={1.75} />
            <CountUp
              value={s.value}
              active={inView && s.value > 0}
              suffix={s.value > 0 ? '+' : ''}
              format={nf}
              className="font-mono text-4xl font-bold tracking-tight tabular"
            />
            <span className="text-sm text-muted-foreground">{s.label}</span>
          </div>
        ))}
        <div className="flex flex-1 flex-col items-center gap-1 px-6 py-4 text-center">
          <Activity className="mb-1 h-5 w-5 text-accent" strokeWidth={1.75} />
          <span className="flex items-center gap-2 font-display text-4xl font-bold tracking-tight">
            <span className="relative flex h-3 w-3" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-success" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
            </span>
            {lang === 'ar' ? 'مباشر' : 'Live'}
          </span>
          <span className="text-sm text-muted-foreground">{lang === 'ar' ? 'أسعار مباشرة' : 'prices'}</span>
        </div>
      </div>
    </div>
  );
}
