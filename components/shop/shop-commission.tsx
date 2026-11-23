'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import { dateAr, egp, type Row } from '@/lib/dashboard';

export function ShopCommission() {
  const supabase = React.useMemo(() => createBrowserSupabaseClient(), []);
  const { toast } = useToast();

  const [status, setStatus] = React.useState<Row | null>(null);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const [st, sh] = await Promise.all([
        supabase.rpc('my_commission_status'),
        supabase
          .from('shipments')
          .select('id, delivered_at, subtotal, commission_rate, commission_amount, commission_paid_at, order:orders(code)')
          .eq('status', 'delivered')
          .order('delivered_at', { ascending: false })
          .limit(200),
      ]);
      if (!alive) return;
      const firstError = st.error ?? sh.error;
      if (firstError) {
        toast({ title: 'تعذر تحميل العمولات', description: firstError.message, variant: 'destructive' });
      }
      setStatus(Array.isArray(st.data) ? st.data[0] ?? null : null);
      setRows(sh.data ?? []);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [supabase, toast]);

  if (loading) return <Skeleton className="h-40" />;

  const due = Number(status?.due ?? 0);
  const limit = status?.limit_amount != null ? Number(status.limit_amount) : null;
  const blocked = !!status?.blocked;

  return (
    <div className="space-y-4">
      {blocked && (
        <Card className="border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          منتجاتك مخفية حالياً من الموقع لأن العمولة المستحقة عدّت الحد. سدّد العمولة وهترجع تظهر تلقائياً.
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">عمولة مستحقة عليك</div>
          <div className="mt-1 text-xl font-bold">{egp(due)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">الحد المسموح</div>
          <div className="mt-1 text-xl font-bold">{limit != null ? egp(limit) : 'مفيش حد'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">حالة منتجاتك</div>
          <div className="mt-2">
            <Badge variant={blocked ? 'destructive' : 'default'}>{blocked ? 'مخفية' : 'ظاهرة'}</Badge>
          </div>
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الطلب</TableHead>
              <TableHead>تاريخ التسليم</TableHead>
              <TableHead>المنتجات</TableHead>
              <TableHead>النسبة</TableHead>
              <TableHead>العمولة</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  لسه مفيش شحنات اتسلّمت.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">{r.order?.code}</TableCell>
                  <TableCell>{dateAr(r.delivered_at)}</TableCell>
                  <TableCell>{egp(r.subtotal)}</TableCell>
                  <TableCell>{Number(r.commission_rate ?? 0)}%</TableCell>
                  <TableCell>{egp(r.commission_amount)}</TableCell>
                  <TableCell>
                    <Badge variant={r.commission_paid_at ? 'default' : 'outline'}>
                      {r.commission_paid_at ? 'مدفوعة' : 'مستحقة'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
