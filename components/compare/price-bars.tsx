'use client';

import * as React from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/components/providers/language-provider';
import { formatEGP } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { OfferWithShop } from '@/lib/types';

/** Horizontal bars: each shop's price relative to the highest one. */
export function PriceBars({ offers }: { offers: OfferWithShop[] }) {
  const { lang } = useLanguage();
  const ref = React.useRef<HTMLUListElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  if (offers.length < 2) return null;
  const sorted = [...offers].sort((a, b) => a.price - b.price);
  const max = sorted[sorted.length - 1].price;
  const min = sorted[0].price;

  return (
    <ul ref={ref} className="space-y-3" aria-label={lang === 'ar' ? 'مقارنة الأسعار بين المحلات' : 'Price comparison across shops'}>
      {sorted.map((o, i) => {
        const pct = Math.max(10, (o.price / max) * 100);
        const best = i === 0;
        const diff = o.price - min;
        return (
          <li key={o.id} className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[130px_minmax(0,1fr)]">
            <span className="truncate text-xs font-medium sm:text-sm" title={o.shop?.name}>
              {o.shop?.name}
            </span>
            <div className="relative h-8 overflow-hidden rounded-xs bg-muted/70">
              <motion.div
                initial={{ width: reduce ? `${pct}%` : 0 }}
                animate={{ width: inView || reduce ? `${pct}%` : 0 }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className={cn('h-full rounded-xs', best ? 'bg-gradient-to-r from-primary to-electric shadow-glow' : 'bg-foreground/20')}
              />
              <span className="price absolute inset-y-0 start-2 flex items-center text-xs font-bold text-foreground">
                {formatEGP(o.price, lang)}
              </span>
              {!best && diff > 0 && (
                <span className="absolute inset-y-0 end-2 flex items-center font-mono text-[10px] text-muted-foreground">
                  +{formatEGP(diff, lang)}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
