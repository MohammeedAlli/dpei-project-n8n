'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/components/providers/admin-provider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAdmin();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && user && !user.isAdmin) {
      router.replace('/admin');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="container mx-auto px-4 py-16" />;
  }

  if (!user || !user.isAdmin) {
    return <div className="container mx-auto px-4 py-16" />;
  }

  return <>{children}</>;
}
