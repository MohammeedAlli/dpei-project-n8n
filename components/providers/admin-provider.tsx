'use client';

import * as React from 'react';

type AdminUser = {
  id: string;
  email: string;
  isAdmin: boolean;
};

type AdminContextValue = {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AdminContext = React.createContext<AdminContextValue | null>(null);

const ADMIN_KEY = 'souk-admin-session';

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AdminUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(ADMIN_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AdminUser;
        setUser(parsed);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 400));
    if (email === 'admin@souk.dev' && password === 'admin123') {
      const adminUser: AdminUser = { id: 'mock-admin', email, isAdmin: true };
      setUser(adminUser);
      try {
        localStorage.setItem(ADMIN_KEY, JSON.stringify(adminUser));
      } catch {
        /* ignore */
      }
      return { error: null };
    }
    return { error: 'بيانات غير صحيحة' };
  }, []);

  const signOut = React.useCallback(async () => {
    setUser(null);
    try {
      localStorage.removeItem(ADMIN_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = React.useMemo(
    () => ({ user, loading, signIn, signOut }),
    [user, loading, signIn, signOut]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = React.useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
