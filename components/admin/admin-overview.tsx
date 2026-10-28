'use client';

import * as React from 'react';
import { ShoppingBag, Clock, Truck, AlertCircle, XCircle, Package, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';

type Stats = {
  newOrders: number;
  preparing: number;
  outForDelivery: number;
  awaitingApproval: number;
  failedWebhooks: number;
  partiallyDelivered: number;
  totalOrders: number;
  totalSales: number;
};

export function AdminOverview() {
  const { lang } = useLanguage();
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const [
          { count: newOrders },
          { count: preparing },
          { count: outForDelivery },
          { count: awaitingApproval },
          { count: failedWebhooks },
          { data: orders },
        ] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'new'),
          supabase.from('shop_orders').select('*', { count: 'exact', head: true }).eq('status', 'preparing'),
          supabase.from('shop_orders').select('*', { count: 'exact', head: true }).eq('status', 'out_for_delivery'),
          supabase.from('shop_orders').select('*', { count: 'exact', head: true }).eq('status', 'awaiting_approval'),
          supabase.from('shop_orders').select('*', { count: 'exact', head: true }).eq('webhook_status', 'failed'),
          supabase.from('orders').select('grand_total, status'),
        ]);

        const totalOrders = orders?.length || 0;
        const totalSales = (orders || []).reduce((s, o) => s + Number(o.grand_total), 0);
        const delivered = (orders || []).filter((o) => o.status === 'delivered').length;
        const partiallyDelivered = delivered > 0 && delivered < totalOrders ? 1 : 0;

        setStats({
          newOrders: newOrders || 0,
          preparing: preparing || 0,
          outForDelivery: outForDelivery || 0,
          awaitingApproval: awaitingApproval || 0,
          failedWebhooks: failedWebhooks || 0,
          partiallyDelivered,
          totalOrders,
          totalSales,
        });
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return <Card className="p-6 text-center text-muted-foreground">{t('admin', 'noData', lang)}</Card>;
  }

  const cards = [
    { label: t('admin', 'newOrders', lang), value: String(stats.newOrders), icon: ShoppingBag, color: 'text-blue-600' },
    { label: t('admin', 'preparing', lang), value: String(stats.preparing), icon: Clock, color: 'text-amber-600' },
    { label: t('admin', 'outForDelivery', lang), value: String(stats.outForDelivery), icon: Truck, color: 'text-purple-600' },
    { label: t('admin', 'awaitingApproval', lang), value: String(stats.awaitingApproval), icon: AlertCircle, color: 'text-orange-600' },
    { label: t('admin', 'failedWebhooks', lang), value: String(stats.failedWebhooks), icon: XCircle, color: 'text-red-600' },
    { label: t('admin', 'partiallyDelivered', lang), value: String(stats.partiallyDelivered), icon: Package, color: 'text-cyan-600' },
    { label: t('admin', 'totalOrders', lang), value: String(stats.totalOrders), icon: ShoppingBag, color: 'text-primary' },
    { label: t('admin', 'totalSales', lang), value: formatEGP(stats.totalSales, lang), icon: BarChart3, color: 'text-accent' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, i) => (
        <Card key={i} className="flex items-center justify-between p-4">
          <div>
            <div className="text-sm text-muted-foreground">{c.label}</div>
            <div className="mt-1 text-2xl font-bold">{c.value}</div>
          </div>
          <c.icon className={`h-8 w-8 ${c.color}`} />
        </Card>
      ))}
    </div>
  );
}
