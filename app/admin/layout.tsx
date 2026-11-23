'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/components/providers/admin-provider';
import { MfaGate } from '@/components/auth/mfa-gate';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, aal, refresh, signOut } = useAdmin();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) return <div className="container mx-auto px-4 py-16" />;

  // signed in, but not an admin (e.g. a shop account)
  if (!user.isAdmin) {
    return (
      <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center" dir="rtl" lang="ar">
        <h1 className="text-xl font-bold">غير مصرح</h1>
        <p className="text-sm text-muted-foreground">الحساب ده مالوش صلاحية دخول لوحة التحكم.</p>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/">الرئيسية</Link>
          </Button>
          <Button variant="ghost" onClick={() => void signOut()}>
            تسجيل الخروج
          </Button>
        </div>
      </div>
    );
  }

  // admin without a TOTP-verified session
  if (aal !== 'aal2') {
    return <MfaGate onDone={() => void refresh()} onSignOut={() => void signOut()} />;
  }

  return <>{children}</>;
}
