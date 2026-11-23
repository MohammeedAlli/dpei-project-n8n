'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { categoryKey, type CategoryKey } from '@/components/category-art';
import { CategoryBackdrop } from '@/components/home/category-backdrop';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';

const FEATURED: CategoryKey[] = ['boards', 'raspberry', 'sensors'];

const wrap: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function CategoryBento({
  categories,
  counts,
  loading,
}: {
  categories: Category[];
  counts: Record<string, number>;
  loading?: boolean;
}) {
  const { lang, dir } = useLanguage();
  const reduce = useReducedMotion();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  // featured first (boards → raspberry → sensors), then the rest in their original order
  const ordered = React.useMemo(() => {
    const withKey = categories.map((c) => ({ c, key: categoryKey(c) }));
    const feat = FEATURED.flatMap((k) => withKey.filter((x) => x.key === k).slice(0, 1));
    const used = new Set(feat.map((x) => x.c.id));
    return [...feat, ...withKey.filter((x) => !used.has(x.c.id))];
  }, [categories]);

  if (loading) {
    return (
      <div className="grid auto-rows-[140px] grid-cols-2 gap-4 md:grid-cols-4">
        <Skeleton className="col-span-2 row-span-2 rounded-lg" />
        <Skeleton className="col-span-2 rounded-lg" />
        <Skeleton className="col-span-2 rounded-lg" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="rounded-lg" />
        ))}
      </div>
    );
  }

  // stretch the last tile so the 4-column grid has no hole at the end
  const cells = ordered.reduce(
    (sum, x) => sum + (x.key === 'boards' ? 4 : FEATURED.includes(x.key) ? 2 : 1),
    0
  );
  const used = cells;
  const remainder = used % 4;
  const lastSpan = remainder === 0 ? 1 : 1 + (4 - remainder);

  return (
    <motion.ul
      variants={wrap}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      className="grid auto-rows-[136px] grid-cols-2 gap-3 sm:gap-4 md:auto-rows-[150px] md:grid-cols-4 [grid-auto-flow:dense]"
    >
      {ordered.map(({ c, key }, i) => {
        const featured = FEATURED.includes(key);
        const big = key === 'boards';
        const isLast = i === ordered.length - 1 && !featured;
        const name = lang === 'ar' ? c.name_ar : c.name_en;
        const n = counts[c.id] ?? 0;

        return (
          <motion.li
            key={c.id}
            variants={rise}
            className={cn(
              featured && 'col-span-2',
              big && 'md:row-span-2',
              isLast && lastSpan > 1 && lastSpan <= 4 && (lastSpan === 2 ? 'md:col-span-2' : lastSpan === 3 ? 'md:col-span-3' : 'md:col-span-4')
            )}
          >
            <motion.div
              whileHover={reduce ? undefined : { y: -5 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className="h-full"
            >
              <Link
                href={`/products?category=${c.id}`}
                className={cn(
                  'group relative flex h-full overflow-hidden rounded-lg border p-4 sm:p-5',
                  'transition-[box-shadow,border-color] duration-base ease-out',
                  'hover:border-accent/70 hover:shadow-glow-md focus-visible:border-accent',
                  featured
                    ? 'border-accent/25 bg-gradient-to-br from-accent/20 via-card to-electric/10'
                    : 'border-border bg-card/80 backdrop-blur',
                  big ? 'flex-col justify-between' : featured ? 'flex-row items-center justify-between' : 'flex-col justify-between'
                )}
              >
                <CategoryBackdrop kind={key} />
                {/* soft glow behind the illustration */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -bottom-10 -end-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl transition-opacity duration-slow group-hover:opacity-100 md:opacity-60"
                />

                {/* label */}
                <div className={cn('relative z-[1] flex min-w-0 flex-col gap-2', big && 'max-w-[60%]')}>
                  <h3
                    className={cn(
                      'font-display font-bold leading-snug',
                      big ? 'text-2xl md:text-3xl' : featured ? 'text-lg md:text-xl' : 'text-sm md:text-base'
                    )}
                  >
                    {name}
                  </h3>
                  <span className="inline-flex w-fit items-center rounded-full border border-border bg-background/70 px-2 py-0.5 font-mono text-[11px] text-muted-foreground backdrop-blur">
                    {t('home', 'productCount', lang).replace('{count}', String(n))}
                  </span>
                </div>

                {/* arrow slides in on hover */}
                <span
                  aria-hidden
                  className={cn(
                    'absolute end-3 top-3 z-[2] flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-glow',
                    'opacity-0 ltr:-translate-x-2 rtl:translate-x-2 transition-[opacity,transform] duration-base ease-out',
                    'group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100'
                  )}
                >
                  <Arrow className="h-4 w-4" />
                </span>
              </Link>
            </motion.div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
