'use client';

import * as React from 'react';
import { Bell, CheckCircle2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Modal } from '@/components/ui/overlay';
import { Button } from '@/components/ui/button';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { createPriceAlert } from '@/lib/price-data';
import { formatEGP } from '@/lib/format';
import type { ProductWithMeta } from '@/lib/catalog';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^(\+?2)?01[0-25][0-9]{8}$/;

export function PriceAlertDialog({
  product,
  open,
  onClose,
  currentBest,
}: {
  product: ProductWithMeta;
  open: boolean;
  onClose: () => void;
  currentBest: number | null;
}) {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [contact, setContact] = React.useState('');
  const [target, setTarget] = React.useState('');
  const [newShop, setNewShop] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const name = lang === 'ar' ? product.name_ar : product.name_en;

  React.useEffect(() => {
    if (open) {
      setDone(false);
      setErr(null);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = contact.trim().replace(/[\s-]/g, '');
    if (!EMAIL.test(c) && !PHONE.test(c)) {
      setErr(L('اكتب إيميل أو رقم موبايل صحيح', 'Enter a valid email or mobile number'));
      return;
    }
    const tp = target ? Number(target) : null;
    if (tp !== null && (!Number.isFinite(tp) || tp <= 0)) {
      setErr(L('السعر المستهدف غير صحيح', 'Invalid target price'));
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await createPriceAlert({ product_id: product.id, contact: c, target_price: tp, notify_new_shop: newShop });
      setDone(true);
    } catch {
      setErr(L('التنبيهات لسه مش مفعّلة. جرّب بعد شوية.', "Alerts aren't enabled yet. Please try again later."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} label={L('تنبيه السعر', 'Price alert')} className="max-w-md">
      <div className="p-6">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-display text-xl font-bold">{L('تمام، هننبّهك', "You're all set")}</h2>
            <p className="text-sm text-muted-foreground">
              {L('هنبعتلك لما السعر ينزل أو محل جديد يضيف المنتج ده.', "We'll message you when the price drops or another shop lists this item.")}
            </p>
            <Button onClick={onClose} className="mt-2">{L('تم', 'Done')}</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="flex items-start gap-3 pe-8">
              <span className="icon-well shrink-0"><Bell className="h-5 w-5" /></span>
              <div>
                <h2 className="font-display text-lg font-bold">{L('نبّهني', 'Set price alert')}</h2>
                <p className="line-clamp-2 text-sm text-muted-foreground">{name}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="alert-contact" className="text-sm font-medium">{L('إيميل أو موبايل', 'Email or mobile')}</label>
              <input
                id="alert-contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                autoComplete="email"
                dir="ltr"
                inputMode="email"
                aria-invalid={!!err}
                aria-describedby={err ? 'alert-err' : undefined}
                className="field h-11"
                placeholder="you@email.com / 01XXXXXXXXX"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="alert-target" className="text-sm font-medium">
                {L('نبّهني لما السعر يوصل (اختياري)', 'Alert me when the price reaches (optional)')}
              </label>
              <input
                id="alert-target"
                type="number"
                min={1}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                dir="ltr"
                className="field price h-11"
                placeholder={currentBest ? formatEGP(Math.floor(currentBest * 0.9), lang) : ''}
              />
              {currentBest !== null && (
                <p className="text-xs text-muted-foreground">{L('أقل سعر حاليًا:', 'Current best:')} <span className="price">{formatEGP(currentBest, lang)}</span></p>
              )}
            </div>

            <ToggleSwitch
              checked={newShop}
              onCheckedChange={setNewShop}
              label={L('نبّهني لو محل جديد ضاف المنتج', 'Tell me when another shop lists it')}
            />

            {err && (
              <p id="alert-err" role="alert" className="rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-red-800 dark:text-red-300">
                {err}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              {L('فعّل التنبيه', 'Activate alert')}
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
}
