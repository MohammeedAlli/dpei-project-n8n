'use client';

import * as React from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import { dateAr, downloadCsv, egp, type Row } from '@/lib/dashboard';

export function AdminReports() {
  const supabase = React.useMemo(() => createBrowserSupabaseClient(), []);
  const { toast } = useToast();

  const [shops, setShops] = React.useState<Row[]>([]);
  const [shopId, setShopId] = React.useState('all');
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [generated, setGenerated] = React.useState(false);

  React.useEffect(() => {
    supabase
      .from('shops')
      .select('id, name')
      .order('name')
      .then(({ data }) => setShops(data ?? []));
  }, [supabase]);

  const generate = async () => {
    setLoading(true);
    let q = supabase
      .from('shipments')
      .select(
        'id, shop_id, shop_name, subtotal, delivery_fee, delivered_at, commission_rate, commission_amount, commission_paid_at, order:orders(code)'
      )
      .eq('status', 'delivered')
      .order('delivered_at', { ascending: false })
      .limit(5000);
    if (shopId !== 'all') q = q.eq('shop_id', shopId);
    if (fromDate) q = q.gte('delivered_at', `${fromDate}T00:00:00`);
    if (toDate) q = q.lte('delivered_at', `${toDate}T23:59:59`);
    const { data, error } = await q;
    setLoading(false);
    if (error) {
      toast({ title: 'تعذر إنشاء التقرير', description: error.message, variant: 'destructive' });
      return;
    }
    setRows(data ?? []);
    setGenerated(true);
  };

  const totals = rows.reduce(
    (acc, r) => {
      acc.sales += Number(r.subtotal ?? 0);
      const c = Number(r.commission_amount ?? 0);
      acc.commission += c;
      if (!r.commission_paid_at) acc.due += c;
      return acc;
    },
    { sales: 0, commission: 0, due: 0 }
  );

  const exportCsv = () => {
    downloadCsv('report.csv', [
      ['كود الطلب', 'المحل', 'تاريخ التسليم', 'سعر المنتجات', 'التوصيل', 'نسبة العمولة %', 'العمولة', 'مدفوعة؟'],
      ...rows.map((r) => [
        r.order?.code ?? '',
        r.shop_name,
        r.delivered_at ? new Date(r.delivered_at).toISOString().slice(0, 10) : '',
        Number(r.subtotal),
        Number(r.delivery_fee),
        Number(r.commission_rate ?? 0),
        Number(r.commission_amount ?? 0),
        r.commission_paid_at ? 'نعم' : 'لا',
      ]),
    ]);
  };

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end gap-3 p-4">
        <div className="space-y-1">
          <Label>المحل</Label>
          <Select value={shopId} onValueChange={setShopId}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المحلات</SelectItem>
              {shops.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>من تاريخ</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} dir="ltr" />
        </div>
        <div className="space-y-1">
          <Label>إلى تاريخ</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} dir="ltr" />
        </div>
        <Button onClick={generate} disabled={loading}>
          <BarChart3 className="h-4 w-4" />
          إنشاء التقرير
        </Button>
        {generated && rows.length > 0 && (
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            تصدير CSV
          </Button>
        )}
      </Card>

      {loading && <Skeleton className="h-40" />}

      {generated && !loading && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">إجمالي المبيعات</div>
              <div className="mt-1 text-lg font-bold">{egp(totals.sales)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">إجمالي العمولة</div>
              <div className="mt-1 text-lg font-bold">{egp(totals.commission)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">عمولة لسه ما اتدفعتش</div>
              <div className="mt-1 text-lg font-bold">{egp(totals.due)}</div>
            </Card>
          </div>

          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطلب</TableHead>
                  <TableHead>المحل</TableHead>
                  <TableHead>التسليم</TableHead>
                  <TableHead>المنتجات</TableHead>
                  <TableHead>النسبة</TableHead>
                  <TableHead>العمولة</TableHead>
                  <TableHead>الدفع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      مفيش شحنات مسلّمة في الفترة دي.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono">{r.order?.code}</TableCell>
                      <TableCell>{r.shop_name}</TableCell>
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
        </>
      )}
    </div>
  );
}
