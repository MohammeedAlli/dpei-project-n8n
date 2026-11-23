'use client';

import * as React from 'react';
import {
  ShoppingBag,
  Clock,
  Truck,
  AlertCircle,
  ClipboardCheck,
  Package,
  Wallet,
  BadgeCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import { egp, errMsg } from '@/lib/dashboard';

type Stats = {
  newShipments: number;
  preparing: number;
  outForDelivery: number;
  awaitingCustomer: number;
  pendingApprovals: number;
  deliveredSales: number;
  commissionDue: number;
  commissionCollected: number;
};

export function AdminOverview() {
  const supabase = React.useMemo(() => createBrowserSupabaseClient(), []);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const count = (status: string) =>
          supabase.from('shipments').select('id', { count: 'exact', head: true }).eq('status', status);

        const [nw, prep, out, awaiting, prods, offers, delivered] = await Promise.all([
          count('new'),
          count('preparing'),
          count('out_for_delivery'),
          count('awaiting_approval'),
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase
            .from('offers')
            .select('id', { count: 'exact', head: true })
            .or('status.eq.pending,pending_price.not.is.null'),
          supabase
            .from('shipments')
            .select('subtotal, commission_amount, commission_paid_at')
            .eq('status', 'delivered')
            .limit(5000),
        ]);

        const firstError = [nw, prep, out, awaiting, prods, offers, delivered].find((r) => r.error)?.error;
        if (firstError) throw firstError;

        let sales = 0;
        let due = 0;
        let collected = 0;
        for (const s of delivered.data ?? []) {
          sales += Number(s.subtotal ?? 0);
          const c = Number(s.commission_amount ?? 0);
          if (s.commission_paid_at) collected += c;
          else due += c;
        }

        if (!alive) return;
        setStats({
          newShipments: nw.count ?? 0,
          preparing: prep.count ?? 0,
          outForDelivery: out.count ?? 0,
          awaitingCustomer: awaiting.count ?? 0,
          pendingApprovals: (prods.count ?? 0) + (offers.count ?? 0),
          deliveredSales: sales,
          commissionDue: due,
          commissionCollected: collected,
        });
      } catch (e) {
        if (alive) setError(errMsg(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [supabase]);

  if (error) {
    return (
      <Card className="p-6 text-sm text-destructive">تعذر تحميل الإحصائيات: {error}</Card>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'شحنات جديدة', value: String(stats.newShipments), icon: ShoppingBag },
    { label: 'جاري التجهيز', value: String(stats.preparing), icon: Clock },
    { label: 'خرجت للتوصيل', value: String(stats.outForDelivery), icon: Truck },
    { label: 'بانتظار موافقة العميل', value: String(stats.awaitingCustomer), icon: AlertCircle },
    { label: 'بانتظار موافقتك (منتجات وأسعار)', value: String(stats.pendingApprovals), icon: ClipboardCheck },
    { label: 'مبيعات تم تسليمها', value: egp(stats.deliveredSales), icon: Package },
    { label: 'عمولات مستحقة لك', value: egp(stats.commissionDue), icon: Wallet },
    { label: 'عمولات تم تحصيلها', value: egp(stats.commissionCollected), icon: BadgeCheck },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <c.icon className="h-4 w-4" />
            {c.label}
          </div>
          <div className="mt-2 text-xl font-bold">{c.value}</div>
        </Card>
      ))}
    </div>
  );
}
