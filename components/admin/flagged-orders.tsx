'use client';

import * as React from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';

type Order = {
  code: string;
  customer_name: string | null;
  phone: string | null;
  grand_total: number | null;
  created_at: string;
  review_reason: string | null;
};

const REASONS: Record<string, string> = {
  high_value: 'قيمة كبيرة',
  repeat_phone: 'نفس الرقم أكتر من مرة في 24 ساعة',
};

export function FlaggedOrders() {
  const supabase = React.useMemo(() => createBrowserSupabaseClient(), []);
  const { toast } = useToast();
  const [rows, setRows] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('code, customer_name, phone, grand_total, created_at, review_reason')
      .eq('needs_confirmation', true)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) toast({ title: 'تعذر تحميل الطلبات', description: error.message, variant: 'destructive' });
    setRows((data ?? []) as Order[]);
    setLoading(false);
  }, [supabase, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const confirm = async (code: string) => {
    setBusy(code);
    const { error } = await supabase.rpc('admin_confirm_order', { p_code: code });
    setBusy(null);
    if (error) {
      toast({ title: 'تعذر التأكيد', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم تأكيد الطلب' });
    await load();
  };

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <p className="text-sm text-muted-foreground">
          طلبات النظام شاكك فيها (قيمة كبيرة أو رقم مكرر). اتصل بالعميل وأكّد الطلب قبل ما المحل يجهّزه، وبعدين اضغط "تم التأكيد".
        </p>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </Card>
      {loading ? (
        <Skeleton className="h-40" />
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>الموبايل</TableHead>
                <TableHead>الإجمالي</TableHead>
                <TableHead>السبب</TableHead>
                <TableHead>الوقت</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    مفيش طلبات محتاجة تأكيد.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((o) => (
                <TableRow key={o.code}>
                  <TableCell dir="ltr" className="font-mono text-xs">{o.code}</TableCell>
                  <TableCell>{o.customer_name ?? '—'}</TableCell>
                  <TableCell dir="ltr">{o.phone ?? '—'}</TableCell>
                  <TableCell>{o.grand_total != null ? `${Number(o.grand_total).toLocaleString('ar-EG')} ج.م` : '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{o.review_reason ? o.review_reason.split(',').map((r) => REASONS[r] ?? r).join(' + ') : '—'}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{new Date(o.created_at).toLocaleString('ar-EG')}</TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => confirm(o.code)} disabled={busy === o.code}>
                      <CheckCircle2 className="h-4 w-4" />
                      تم التأكيد
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
