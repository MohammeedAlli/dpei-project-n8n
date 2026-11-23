'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Hash, Loader2, Phone, Search } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { FloatingField } from '@/components/track/floating-field';
import { TrackArt } from '@/components/track/track-art';
import { ShipmentTimeline } from '@/components/track/shipment-timeline';
import { formatDate, formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getActiveShops, getOrderByCodeAndPhone } from '@/data/api';
import type { OrderRecord } from '@/data/types';

const CODE_RE = /^SQ-?[A-Z0-9]{4,10}$/;
const PHONE_RE = /^(?:\+?20|0)?1[0125]\d{8}$/;

const normCode = (v: string) => {
  const c = v.trim().toUpperCase().replace(/\s+/g, '');
  return /^SQ[A-Z0-9]/.test(c) && !c.startsWith('SQ-') ? `SQ-${c.slice(2)}` : c;
};
/** accepts 01XXXXXXXXX, +201XXXXXXXXX, 201XXXXXXXXX, Arabic-Indic digits */
const normPhone = (v: string) => {
  const d = v
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[^\d+]/g, '')
    .replace(/^\+?20/, '0');
  return d.startsWith('0') ? d : `0${d}`;
};

export default function TrackPage() {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [code, setCode] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [touched, setTouched] = React.useState({ code: false, phone: false });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [order, setOrder] = React.useState<OrderRecord | null>(null);
  const [wa, setWa] = React.useState<Record<string, string | null>>({});
  const resultRef = React.useRef<HTMLDivElement>(null);

  const codeOk = CODE_RE.test(normCode(code));
  const phoneOk = PHONE_RE.test(normPhone(phone)) && normPhone(phone).length === 11;
  const codeErr = touched.code && code && !codeOk ? L('الكود بالشكل SQ-12345', 'Use the format SQ-12345') : null;
  const phoneErr = touched.phone && phone && !phoneOk ? L('رقم موبايل مصري بالشكل 01XXXXXXXXX', 'Egyptian mobile like 01XXXXXXXXX') : null;
  const canSubmit = codeOk && phoneOk && !loading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const found = await getOrderByCodeAndPhone(normCode(code), normPhone(phone));
      if (!found) {
        setError(t('track', 'notFound', lang));
      } else {
        setOrder(found);
        // shop WhatsApp numbers live on the shops table, not on the shipment
        getActiveShops()
          .then((shops) => setWa(Object.fromEntries(shops.map((s) => [s.id, s.contact_whatsapp]))))
          .catch(() => {});
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }), 120);
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'rate_limited'
          ? L('محاولات كتير. استنى 15 دقيقة وجرّب تاني.', 'Too many attempts. Please wait 15 minutes and try again.')
          : t('common', 'error', lang)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-pcb">
      <div className="container px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-lg">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 shadow-3 sm:p-8">
            <TrackArt className="mx-auto mb-4 h-28 w-auto sm:h-32" />
            <h1 className="text-center font-display text-2xl font-bold">{t('track', 'title', lang)}</h1>
            <p className="mx-auto mb-6 mt-1.5 max-w-sm text-center text-sm text-muted-foreground">{t('track', 'enterCredentials', lang)}</p>

            <form onSubmit={submit} noValidate className="space-y-1">
              <FloatingField
                label={t('track', 'orderCode', lang)}
                hint={L('مثال: SQ-12345 (من رسالة التأكيد)', 'e.g. SQ-12345 (from your confirmation)')}
                icon={<Hash className="h-4 w-4" />}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onBlur={() => setTouched((s) => ({ ...s, code: true }))}
                error={codeErr}
                valid={codeOk}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                dir="ltr"
                className="text-start font-mono uppercase"
              />
              <FloatingField
                label={t('track', 'phone', lang)}
                hint={L('الرقم اللي سجّلت بيه الطلب: 01XXXXXXXXX', 'The number used for the order: 01XXXXXXXXX')}
                icon={<Phone className="h-4 w-4" />}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setTouched((s) => ({ ...s, phone: true }))}
                error={phoneErr}
                valid={phoneOk}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                className="text-start"
              />
              <Button type="submit" size="lg" disabled={!canSubmit} className="btn-shine mt-2 w-full">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                {loading ? t('track', 'tracking', lang) : t('track', 'submit', lang)}
              </Button>
            </form>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} role="alert" className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-center text-sm text-destructive">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          <div ref={resultRef} className="scroll-mt-24">
            <AnimatePresence>
              {order && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-4">
                  <div className="flex flex-wrap items-end justify-between gap-3 px-1">
                    <div>
                      <p className="text-xs text-muted-foreground">{L('رقم الطلب', 'Order')}</p>
                      <p className="font-mono text-lg font-bold" dir="ltr">{order.code}</p>
                    </div>
                    <div className="text-end">
                      <p className="text-xs text-muted-foreground">{formatDate(order.created_at, lang)}</p>
                      <p className="price font-bold">{formatEGP(order.grand_total, lang)} <span className="text-xs font-normal text-muted-foreground">· {L('الدفع عند الاستلام', 'Cash on delivery')}</span></p>
                    </div>
                  </div>
                  {order.shipments.map((s, i) => (
                    <ShipmentTimeline key={s.id} shipment={s} index={i} shopWhatsapp={wa[s.shop_id]} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
