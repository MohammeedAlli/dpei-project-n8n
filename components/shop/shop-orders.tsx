'use client';

import * as React from 'react';
import { RotateCw, Phone, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import {
  SHOP_ALLOWED_STATUSES,
  SHOP_LOCKED_STATUSES,
  ALL_SHIPMENT_STATUSES,
  dateAr,
  egp,
  itemName,
  statusLabel,
  statusVariant,
  waLink,
  type Row,
} from '@/lib/dashboard';

export function ShopOrders() {
  const supabase = React.useMemo(() => createBrowserSupabaseClient(), []);
  const { toast } = useToast();

  const [shipments, setShipments] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('all');
  const [chosen, setChosen] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    // الأمان (RLS) بيرجّع شحنات المحل ده بس
    const { data, error } = await supabase
      .from('shipments')
      .select(
        '*, order:orders(code, customer_name, phone, governorate, address, notes, created_at), shipment_items(*)'
      )
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      toast({ title: 'تعذر تحميل الطلبات', description: error.message, variant: 'destructive' });
    }
    setShipments(data ?? []);
    setLoading(false);
  }, [supabase, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const save = async (s: Row) => {
    const next = chosen[s.id];
    if (!next || next === s.status) return;
    setBusy(s.id);
    const { error } = await supabase.from('shipments').update({ status: next }).eq('id', s.id);
    setBusy(null);
    if (error) {
      toast({ title: 'تعذر تغيير الحالة', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم تحديث الحالة' });
    setChosen((p) => {
      const copy = { ...p };
      delete copy[s.id];
      return copy;
    });
    await load();
  };

  const visible = shipments.filter((s) => filter === 'all' || s.status === filter);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {ALL_SHIPMENT_STATUSES.map((st) => (
              <SelectItem key={st} value={st}>
                {statusLabel(st)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={load} aria-label="تحديث">
          <RotateCw className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">
          بتقدر تغيّر الحالة إلى: تم التأكيد، جاري التجهيز، خرج للتوصيل، أو غير متوفر.
        </span>
      </Card>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">مفيش طلبات.</Card>
      ) : (
        visible.map((s) => {
          const o: Row = s.order ?? {};
          const locked = SHOP_LOCKED_STATUSES.includes(s.status);
          const options = SHOP_ALLOWED_STATUSES.includes(s.status)
            ? SHOP_ALLOWED_STATUSES
            : [s.status, ...SHOP_ALLOWED_STATUSES];
          return (
            <Card key={s.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{o.code}</span>
                  <span className="text-xs text-muted-foreground">{dateAr(s.created_at)}</span>
                </div>
                <Badge variant={statusVariant(s.status)}>{statusLabel(s.status)}</Badge>
              </div>

              <div className="grid gap-1 text-sm md:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">العميل: </span>
                  {o.customer_name}
                </div>
                <div className="flex items-center gap-2" dir="ltr">
                  <span>{o.phone}</span>
                  <a href={`tel:${o.phone}`} className="text-primary" aria-label="اتصال">
                    <Phone className="h-4 w-4" />
                  </a>
                  <a href={waLink(o.phone)} target="_blank" rel="noreferrer" className="text-primary" aria-label="واتساب">
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </div>
                <div className="md:col-span-2">
                  <span className="text-muted-foreground">العنوان: </span>
                  {o.governorate} - {o.address}
                </div>
                {o.notes && (
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">ملاحظات: </span>
                    {o.notes}
                  </div>
                )}
              </div>

              <Separator />
              <ul className="space-y-1 text-sm">
                {(s.shipment_items ?? []).map((it: Row) => (
                  <li key={it.id} className="flex justify-between gap-2">
                    <span>
                      {itemName(it.product_name)} × {it.quantity}
                    </span>
                    <span>{egp(Number(it.unit_price) * Number(it.quantity))}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold">
                <span>إجمالي منتجاتك: {egp(s.subtotal)}</span>
                <span className="font-normal text-muted-foreground">رسوم التوصيل: {egp(s.delivery_fee)}</span>
              </div>

              {!locked && (
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={chosen[s.id] ?? s.status} onValueChange={(v) => setChosen((p) => ({ ...p, [s.id]: v }))}>
                    <SelectTrigger className="h-9 w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((st) => (
                        <SelectItem key={st} value={st} disabled={!SHOP_ALLOWED_STATUSES.includes(st)}>
                          {statusLabel(st)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    disabled={busy === s.id || !chosen[s.id] || chosen[s.id] === s.status}
                    onClick={() => save(s)}
                  >
                    حفظ الحالة
                  </Button>
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
