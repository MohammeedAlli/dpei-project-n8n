'use client';

import * as React from 'react';
import { LayoutDashboard, ShoppingBag, Store, BarChart3, ClipboardCheck } from 'lucide-react';
import { useAdmin } from '@/components/providers/admin-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminOverview } from '@/components/admin/admin-overview';
import { AdminOrders } from '@/components/admin/admin-orders';
import { AdminApprovals } from '@/components/admin/admin-approvals';
import { AdminShops } from '@/components/admin/admin-shops';
import { AdminReports } from '@/components/admin/admin-reports';
import { LogoutButton } from '@/components/auth/logout-button';

export default function AdminDashboardPage() {
  const { user } = useAdmin();

  return (
    <div className="container mx-auto px-4 py-6" dir="rtl" lang="ar">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-cairo text-xl font-bold">لوحة التحكم</h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <LogoutButton />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex h-auto flex-wrap">
          <TabsTrigger value="overview" className="gap-1.5">
            <LayoutDashboard className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5">
            <ShoppingBag className="h-4 w-4" />
            الطلبات
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-1.5">
            <ClipboardCheck className="h-4 w-4" />
            الموافقات
          </TabsTrigger>
          <TabsTrigger value="shops" className="gap-1.5">
            <Store className="h-4 w-4" />
            المحلات والعمولات
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            التقارير
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdminOverview />
        </TabsContent>
        <TabsContent value="orders">
          <AdminOrders />
        </TabsContent>
        <TabsContent value="approvals">
          <AdminApprovals />
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
