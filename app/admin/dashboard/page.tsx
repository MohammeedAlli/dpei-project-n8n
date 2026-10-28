'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Store, BarChart3, LogOut } from 'lucide-react';
import { useAdmin } from '@/components/providers/admin-provider';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { AdminOverview } from '@/components/admin/admin-overview';
import { AdminOrders } from '@/components/admin/admin-orders';
import { AdminShops } from '@/components/admin/admin-shops';
import { AdminReports } from '@/components/admin/admin-reports';

export default function AdminDashboardPage() {
  const { lang } = useLanguage();
  const { user, signOut } = useAdmin();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/admin');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-cairo text-xl font-bold">{t('admin', 'title', lang)}</h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          {t('admin', 'logout', lang)}
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="overview" className="gap-1.5">
            <LayoutDashboard className="h-4 w-4" />
            {t('admin', 'overview', lang)}
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5">
            <ShoppingBag className="h-4 w-4" />
            {t('admin', 'orders', lang)}
          </TabsTrigger>
          <TabsTrigger value="shops" className="gap-1.5">
            <Store className="h-4 w-4" />
            {t('admin', 'shops', lang)}
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            {t('admin', 'reports', lang)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdminOverview />
        </TabsContent>
        <TabsContent value="orders">
          <AdminOrders />
        </TabsContent>
        <TabsContent value="shops">
          <AdminShops />
        </TabsContent>
        <TabsContent value="reports">
          <AdminReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
