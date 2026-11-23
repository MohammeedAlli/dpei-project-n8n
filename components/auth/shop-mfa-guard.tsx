'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import { MfaGate } from '@/components/auth/mfa-gate';

/**
 * Wrap the shop dashboard with this. A signed-in user whose session is not TOTP-verified (aal2)
 * gets the enroll / code screen instead of the dashboard.
 * It only gates the UI. Real enforcement for shop data is in supabase/sec_09_shop_mfa_db.sql (stage 2).
 */
export function ShopMfaGuard({ children }: { children: React.ReactNode }) {
  const supabase = React.useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const [state, setState] = React.useState<'loading' | 'ok' | 'mfa'>('loading');

  const check = React.useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) {
      setState('ok'); // not signed in: the page's own login redirect handles it
      return;
    }
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setState(!error && data?.currentLevel === 'aal2' ? 'ok' : 'mfa');
  }, [supabase]);

  React.useEffect(() => {
    void check();
  }, [check]);

  if (state === 'loading')
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  if (state === 'mfa')
    return (
      <MfaGate
        subtitle="مطلوب لدخول لوحة المحل"
        onDone={() => void check()}
        onSignOut={() => {
          void supabase.auth.signOut().then(() => router.replace('/login'));
        }}
      />
    );
  return <>{children}</>;
}
