'use client';

import * as React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Mode = 'loading' | 'enroll' | 'challenge' | 'error';

/**
 * Two-step verification for admins (TOTP: Google Authenticator, Microsoft Authenticator, Authy…).
 *  - no verified factor  → enroll: scan QR, confirm with the first code
 *  - verified factor     → challenge: enter the 6-digit code
 * On success the session becomes aal2 and `onDone` is called.
 */
export function MfaGate({ onDone, onSignOut, subtitle = 'مطلوب لدخول لوحة التحكم' }: { onDone: () => void; onSignOut: () => void; subtitle?: string }) {
  const supabase = React.useMemo(() => createBrowserSupabaseClient(), []);
  const [mode, setMode] = React.useState<Mode>('loading');
  const [factorId, setFactorId] = React.useState('');
  const [qr, setQr] = React.useState('');
  const [secret, setSecret] = React.useState('');
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fails, setFails] = React.useState(0);
  const [lockUntil, setLockUntil] = React.useState(0);

  React.useEffect(() => {
    let live = true;
    (async () => {
      const { data: list, error: listErr } = await supabase.auth.mfa.listFactors();
      if (!live) return;
      if (listErr || !list) {
        setMode('error');
        return;
      }
      const verified = list.totp?.[0]; // `totp` only holds verified factors
      if (verified) {
        setFactorId(verified.id);
        setMode('challenge');
        return;
      }
      // drop half-finished enrollments so a new one can start
      for (const f of list.all ?? []) {
        if (f.factor_type === 'totp' && f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Electro Hub ${new Date().toISOString().slice(0, 10)}`,
      });
      if (!live) return;
      if (enrollErr || !data) {
        setMode('error');
        return;
      }
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setMode('enroll');
    })();
    return () => {
      live = false;
    };
  }, [supabase]);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || Date.now() < lockUntil || !/^\d{6}$/.test(code)) return;
    setBusy(true);
    setError(null);
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    const res = chErr || !ch ? { error: chErr } : await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code });
    setBusy(false);
    if (res.error) {
      const n = fails + 1;
      setFails(n);
      setCode('');
      if (n >= 5) {
        setLockUntil(Date.now() + 30_000);
        setFails(0);
        setError('محاولات كتير. استنى 30 ثانية وجرّب تاني.');
      } else {
        setError('الكود غير صحيح، جرّب تاني.');
      }
      return;
    }
    onDone();
  };

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-12" dir="rtl" lang="ar">
      <Card className="w-full max-w-md space-y-5 p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold">التحقق بخطوتين</h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {mode === 'loading' && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {mode === 'error' && (
          <p role="alert" className="text-sm text-destructive">
            تعذّر تجهيز التحقق بخطوتين. تأكد إن TOTP مفعّل في Supabase (Authentication ← Multi-Factor) وحاول تاني.
          </p>
        )}

        {(mode === 'enroll' || mode === 'challenge') && (
          <form onSubmit={verify} className="space-y-4">
            {mode === 'enroll' ? (
              <>
                <p className="text-sm">
                  1. افتح تطبيق المصادقة (Google Authenticator مثلًا) وامسح الكود.
                  <br />
                  2. اكتب الكود المكوّن من 6 أرقام.
                </p>
                {qr && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr} alt="QR code" data-no-plate data-no-dim className="mx-auto h-44 w-44 rounded-md bg-white p-2" />
                )}
                <p className="break-all text-center text-xs text-muted-foreground" dir="ltr">
                  {secret}
                </p>
              </>
            ) : (
              <p className="text-sm">اكتب الكود الظاهر في تطبيق المصادقة.</p>
            )}
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              dir="ltr"
              className="text-center font-mono text-lg tracking-widest"
              aria-label="كود التحقق"
              autoFocus
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'enroll' ? 'تفعيل ودخول' : 'دخول'}
            </Button>
          </form>
        )}

        <Button type="button" variant="ghost" className="w-full" onClick={onSignOut}>
          تسجيل الخروج
        </Button>
      </Card>
    </div>
  );
}
