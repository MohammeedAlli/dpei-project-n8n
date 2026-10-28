'use client';

import * as React from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { formatEGP, formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';

type ShopOption = { id: string; name: string };

type ReportRow = {
  shop_order_id: string;
  order_code: string;
  shop_name: string;
  subtotal: number;
  delivery_fee: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  created_at: string;
};

export function AdminReports() {
  const { lang } = useLanguage();
  const [shops, setShops] = React.useState<ShopOption[]>([]);
  const [shopId, setShopId] = React.useState('all');
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');
  const [rows, setRows] = React.useState<ReportRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [generated, setGenerated] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('shops')
        .select('id, name')
        .order('name');
      setShops((data || []) as unknown as ShopOption[]);
    })();
  }, []);

  const generate = async () => {
    setLoading(true);
    setGenerated(true);

    let query = supabase
      .from('shop_orders')
      .select(`
        id,
        subtotal,
        delivery_fee,
        commission_rate_snapshot,
        commission_amount,
        status,
        created_at,
        shop:shops(name),
        order:orders(code)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (shopId !== 'all') {
      query = query.eq('shop_id', shopId);
    }
    if (fromDate) {
      query = query.gte('created_at', new Date(fromDate).toISOString());
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59);
      query = query.lte('created_at', end.toISOString());
    }

    const { data } = await query;
    const mapped: ReportRow[] = (data || []).map((r: Record<string, unknown>) => ({
      shop_order_id: r.id as string,
      order_code: (r.order as { code: string }).code,
      shop_name: (r.shop as { name: string }).name,
      subtotal: Number(r.subtotal),
      delivery_fee: Number(r.delivery_fee),
      commission_rate: Number(r.commission_rate_snapshot),
      commission_amount: Number(r.commission_amount),
      status: r.status as string,
      created_at: r.created_at as string,
    }));
    setRows(mapped);
    setLoading(false);
  };

  const exportCsv = () => {
    const headers = [
      t('admin', 'orderCode', lang),
      t('admin', 'shopNameLabel', lang),
      t('admin', 'subtotal', lang),
      t('admin', 'deliveryFeeLabel', lang),
      t('admin', 'commissionRateSnapshot', lang),
      t('admin', 'commissionAmount', lang),
      t('admin', 'shipmentStatus', lang),
      t('admin', 'date', lang),
    ];
    const lines = [headers.join(',')];
    for (const r of rows) {
      lines.push([
        r.order_code,
        `"${r.shop_name}"`,
        r.subtotal.toFixed(2),
        r.delivery_fee.toFixed(2),
        `${(r.commission_rate * 100).toFixed(1)}%`,
        r.commission_amount.toFixed(2),
        t('shipment', r.status, lang),
        formatDate(r.created_at, lang),
      ].join(','));
    }
    const csv = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalSales = rows.reduce((s, r) => s + r.subtotal, 0);
  const totalCommission = rows.reduce((s, r) => s + r.commission_amount, 0);
  const totalDelivery = rows.reduce((s, r) => s + r.delivery_fee, 0);
  const cancelledCount = rows.filter((r) => r.status === 'cancelled').length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">{t('admin', 'selectShop', lang)}</Label>
            <Select value={shopId} onValueChange={setShopId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('admin', 'allShops', lang)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin', 'allShops', lang)}</SelectItem>
                {shops.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('admin', 'fromDate', lang)}</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('admin', 'toDate', lang)}</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
          </div>
          <Button onClick={generate} disabled={loading}>
            <BarChart3 className="h-4 w-4" />
            {t('admin', 'generate', lang)}
          </Button>
          {rows.length > 0 && (
            <Button variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              {t('admin', 'exportCsv', lang)}
            </Button>
          )}
        </div>
      </Card>

      {/* Summary */}
      {generated && !loading && rows.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">{t('admin', 'totalSales', lang)}</div>
            <div className="mt-1 text-xl font-bold">{formatEGP(totalSales, lang)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">{t('admin', 'totalCommission', lang)}</div>
            <div className="mt-1 text-xl font-bold text-accent">{formatEGP(totalCommission, lang)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">
              {t('admin', 'deliveryFeeLabel', lang)} · {t('shipment', 'cancelled', lang)}: {cancelledCount}
            </div>
            <div className="mt-1 text-xl font-bold">{formatEGP(totalDelivery, lang)}</div>
          </Card>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <Skeleton className="h-64" />
      ) : generated && rows.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">{t('admin', 'noData', lang)}</Card>
      ) : generated && rows.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin', 'orderCode', lang)}</TableHead>
                  <TableHead>{t('admin', 'shopNameLabel', lang)}</TableHead>
                  <TableHead className="text-end">{t('admin', 'subtotal', lang)}</TableHead>
                  <TableHead className="text-end">{t('admin', 'deliveryFeeLabel', lang)}</TableHead>
                  <TableHead className="text-end">{t('admin', 'commissionRateSnapshot', lang)}</TableHead>
                  <TableHead className="text-end">{t('admin', 'commissionAmount', lang)}</TableHead>
                  <TableHead>{t('admin', 'shipmentStatus', lang)}</TableHead>
                  <TableHead>{t('admin', 'date', lang)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.shop_order_id}>
                    <TableCell className="font-mono text-xs">{r.order_code}</TableCell>
                    <TableCell className="text-sm">{r.shop_name}</TableCell>
                    <TableCell className="text-end text-sm">{formatEGP(r.subtotal, lang)}</TableCell>
                    <TableCell className="text-end text-sm">{formatEGP(r.delivery_fee, lang)}</TableCell>
                    <TableCell className="text-end text-sm">{(r.commission_rate * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-end text-sm font-medium text-accent">{formatEGP(r.commission_amount, lang)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${r.status === 'cancelled' ? 'border-destructive/40 text-destructive' : ''}`}
                      >
                        {t('shipment', r.status, lang)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(r.created_at, lang)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
