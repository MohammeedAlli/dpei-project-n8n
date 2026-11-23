'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, CheckCircle2, MessageCircle, PackageCheck, PackagePlus, Store, Truck, Warehouse, XCircle } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { formatDate, formatEGP } from '@/lib/format';
import { normalizeWhatsapp } from '@/lib/contact';
import { cn } from '@/lib/utils';
import type { ShipmentStatus } from '@/lib/types';
import type { ShipmentRecord } from '@/data/types';

type Step = { key: string; icon: React.ElementType; ar: string; en: string; statuses: ShipmentStatus[] };

/**
 * 5 visual steps over the 5 positive statuses stored in the DB.
 * `preparing` is shown as "Shipped": the DB has no separate shipped state (see README).
 */
const STEPS: Step[] = [
  { key: 'placed', icon: PackagePlus, ar: 'تم تسجيل الطلب', en: 'Order placed', statuses: ['new'] },
  { key: 'confirmed', icon: Store, ar: 'المحل أكّد الطلب', en: 'Confirmed by shop', statuses: ['confirmed'] },
  { key: 'shipped', icon: Warehouse, ar: 'جاري التجهيز والشحن', en: 'Preparing & shipped', statuses: ['preparing'] },
  { key: 'out', icon: Truck, ar: 'خرج للتوصيل', en: 'Out for delivery', statuses: ['out_for_delivery'] },
  { key: 'delivered', icon: PackageCheck, ar: 'تم التسليم', en: 'Delivered', statuses: ['delivered'] },
];

const PROBLEM: Partial<Record<ShipmentStatus, { ar: string; en: string; tone: 'bad' | 'warn' }>> = {
  cancelled: { ar: 'الشحنة دي اتلغت.', en: 'This shipment was cancelled.', tone: 'bad' },
  unavailable: { ar: 'المنتج مش متاح عند المحل حالياً. هنتواصل معاك لبديل أو استرجاع.', en: 'The item is unavailable at the shop. We will contact you about an alternative or refund.', tone: 'bad' },
  price_changed: { ar: 'السعر اتغيّر عند المحل. محتاجين موافقتك قبل ما نكمّل.', en: 'The shop changed the price. We need your approval before continuing.', tone: 'warn' },
  awaiting_approval: { ar: 'الشحنة منتظرة موافقتك.', en: 'This shipment is waiting for your approval.', tone: 'warn' },
};

export function ShipmentTimeline({
  shipment,
  index,
  shopWhatsapp,
  courier,
}: {
  shipment: ShipmentRecord;
  index: number;
  shopWhatsapp?: string | null;
  /** only shown when the data actually has it (the DB has no courier column today) */
  courier?: string | null;
}) {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const problem = PROBLEM[shipment.status];
  const current = problem ? 0 : Math.max(0, STEPS.findIndex((s) => s.statuses.includes(shipment.status)));
  const wa = normalizeWhatsapp(shopWhatsapp);
  const pct = (current / (STEPS.length - 1)) * 100;
  const done = !problem && current === STEPS.length - 1;

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-1" aria-label={shipment.shop_name}>
      <header className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/40 px-4 py-3">
        <span className="icon-well h-9 w-9"><Store className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{L('شحنة', 'Shipment')} {index + 1}</p>
          <h3 className="truncate font-semibold">{shipment.shop_name}</h3>
        </div>
        <div className="text-end">
          <p className="price text-sm font-bold">{formatEGP(shipment.subtotal + shipment.delivery_fee, lang)}</p>
          {courier && <p className="text-xs text-muted-foreground">{L('المندوب: ', 'Courier: ')}{courier}</p>}
        </div>
      </header>

      <div className="p-4 sm:p-5">
        {problem && (
          <div role="alert" className={cn('mb-5 flex items-start gap-2.5 rounded-md border p-3 text-sm', problem.tone === 'bad' ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300')}>
            {problem.tone === 'bad' ? <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{lang === 'ar' ? problem.ar : problem.en}</span>
          </div>
        )}

        {/* vertical timeline; the track is on the inline-start edge, so it mirrors in RTL automatically */}
        <ol className="relative">
          <span aria-hidden className="absolute bottom-5 start-5 top-5 w-0.5 -translate-x-1/2 rounded-full bg-border rtl:translate-x-1/2" />
          <span aria-hidden className="absolute bottom-5 start-5 top-5 w-0.5 -translate-x-1/2 overflow-hidden rounded-full rtl:translate-x-1/2">
            <motion.span
              className="block h-full w-full origin-top bg-gradient-to-b from-primary to-electric"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: pct / 100 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </span>
          {STEPS.map((s, i) => {
            const state = i < current || done ? 'done' : i === current ? 'current' : 'todo';
            const Icon = s.icon;
            const stamp = i === 0 ? shipment.created_at : i === current && i > 0 && !problem ? shipment.updated_at : null;
            return (
              <motion.li
                key={s.key}
                initial={{ opacity: 0, x: lang === 'ar' ? 12 : -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 * i, duration: 0.35 }}
                className="relative flex items-start gap-4 pb-6 last:pb-0"
                aria-current={state === 'current' ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    state === 'done' && 'border-transparent bg-brand-gradient text-primary-foreground',
                    state === 'current' && !problem && 'border-accent bg-card text-accent shadow-glow',
                    state === 'current' && problem && 'border-border bg-card text-muted-foreground',
                    state === 'todo' && 'border-border bg-card text-muted-foreground'
                  )}
                >
                  {state === 'current' && !problem && <span aria-hidden className="absolute inset-0 animate-pulse-ring rounded-full bg-accent/30" />}
                  {state === 'done' ? <Check className="h-5 w-5" /> : <Icon className="relative h-[18px] w-[18px]" />}
                </span>
                <div className="min-w-0 pt-1.5">
                  <p className={cn('text-sm font-semibold', state === 'todo' && 'text-muted-foreground')}>{lang === 'ar' ? s.ar : s.en}</p>
                  {stamp ? (
                    <p className="text-xs text-muted-foreground" dir="auto">{formatDate(stamp, lang)}</p>
                  ) : state === 'todo' ? (
                    <p className="text-xs text-muted-foreground/70">{L('في الانتظار', 'Pending')}</p>
                  ) : null}
                </div>
              </motion.li>
            );
          })}
        </ol>

        <ul className="mt-5 space-y-1 rounded-md bg-muted/50 p-3 text-sm">
          {shipment.items.map((it, i) => {
            const [en, ar] = it.product_name.split('|');
            return (
              <li key={i} className="flex justify-between gap-3">
                <span className="min-w-0 truncate" dir="auto">{lang === 'ar' ? ar || en : en}</span>
                <span className="shrink-0 text-muted-foreground">× {it.quantity}</span>
              </li>
            );
          })}
        </ul>

        {wa && (
          <Button asChild variant="outline" className="mt-4 w-full border-emerald-500/50 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300 sm:w-auto">
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(L('مرحباً، بسأل عن طلبي', 'Hello, I am asking about my order'))}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              {L('تواصل على واتساب', 'Contact on WhatsApp')}
            </a>
          </Button>
        )}
        {done && <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" />{L('تم تسليم الشحنة.', 'Shipment delivered.')}</p>}
      </div>
    </section>
  );
}
