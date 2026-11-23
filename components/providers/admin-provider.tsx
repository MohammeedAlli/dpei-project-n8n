'use client';

import * as React from 'react';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';

type AdminUser = {
  id: string;
  email: string;
  /** true only when profiles.role === 'admin' (was: true for ANY signed-in user) */
  isAdmin: boolean;
  role: string | null;
};

type Aal = 'aal1' | 'aal2' | null;

type AdminContextValue = {
  user: AdminUser | null;
  loading: boolean;
  /** current assurance level of the session; admins need 'aal2' (TOTP verified) */
  aal: Aal;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AdminContext = React.createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AdminUser | null>(null);
  const [aal, setAal] = React.useState<Aal>(null);
  const [loading, setLoading] = React.useState(true);
  const supabase = React.useMemo(() => createBrowserSupabaseClient(), []);
  const alive = React.useRef(true);

  const load = React.useCallback(
    async (id: string | undefined, email: string | undefined) => {
      if (!id) {
        if (alive.current) {
          setUser(null);
          setAal(null);
        }
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', id).maybeSingle();
      const role = (profile?.role as string | undefined) ?? null;
      let level: Aal = null;
      if (role === 'admin') {
        const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        level = (data?.currentLevel as Aal) ?? null;
      }
      if (!alive.current) return;
      setUser({ id, email: email ?? '', isAdmin: role === 'admin', role });
      setAal(level);
    },
    [supabase]
  );

  React.useEffect(() => {
    alive.current = true;
    supabase.auth.getUser().then(async ({ data }) => {
      await load(data.user?.id, data.user?.email);
      if (alive.current) setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // never call supabase.* directly inside this callback (can deadlock): defer it
      setTimeout(() => void load(session?.user?.id, session?.user?.email), 0);
    });
    return () => {
      alive.current = false;
      subscription.unsubscribe();
    };
  }, [supabase, load]);

  const refresh = React.useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    await load(data.user?.id, data.user?.email);
  }, [supabase, load]);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAal(null);
  }, [supabase]);

  const value = React.useMemo(() => ({ user, loading, aal, refresh, signOut }), [user, loading, aal, refresh, signOut]);
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = React.useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
