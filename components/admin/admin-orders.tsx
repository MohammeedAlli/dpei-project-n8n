'use client';

import * as React from 'react';
import { Search, ChevronDown, ChevronLeft, RotateCw, Phone, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ALL_SHIPMENT_STATUSES,
  cleanSearch,
  dateAr,
  egp,
  itemName,
  statusLabel,
  statusVariant,
  waLink,
  type Row,
} from '@/lib/dashboard';

export function AdminOrders() {
  const supabase = React.useMemo(() => createBrowserSupabaseClient(), []);
  const { toast } = useToast();

  const [orders, setOrders] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [chosen, setChosen] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('orders')
      .select('*, shipments(*, shipment_items(*))')
      .order('created_at', { ascending: false })
      .limit(100);
    const s = cleanSearch(search);
    if (s) q = q.or(`code.ilike.%${s}%,phone.ilike.%${s}%,customer_name.ilike.%${s}%`);
    const { data, error } = await q;
    if (error) {
      toast({ title: 'تعذر تحميل الطلبات', description: error.message, variant: 'destructive' });
    }
    setOrders(data ?? []);
    setLoading(false);
  }, [supabase, search, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const saveStatus = async (ship: Row) => {
    const next = chosen[ship.id];
    if (!next || next === ship.status) return;
    setBusy(ship.id);
    const { error } = await supabase.from('shipments').update({ status: next }).eq('id', ship.id);
    setBusy(null);
    if (error) {
      toast({ title: 'تعذر تغيير الحالة', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم حفظ الحالة' });
    setChosen((p) => {
      const copy = { ...p };
      delete copy[ship.id];
      return copy;
    });
    await load();
  };

  const markPaid = async (ship: Row) => {
    setBusy(ship.id);
    const { error } = await supabase
      .from('shipments')
      .update({ commission_paid_at: new Date().toISOString() })
      .eq('id', ship.id);
    setBusy(null);
    if (error) {
      toast({ title: 'تعذر تسجيل الدفع', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم تسجيل استلام العمولة' });
    await load();
  };

  const visible = orders.filter(
    (o) =>
      statusFilter === 'all' ||
      (o.shipments ?? []).some((s: Row) => s.status === statusFilter)
  );

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end gap-3 p-4">
        <form
          className="relative min-w-[220px] flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ابحث بالكود أو التليفون أو اسم العميل (Enter)"
            className="ps-9"
          />
        </form>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {ALL_SHIPMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={load} aria-label="تحديث">
          <RotateCw className="h-4 w-4" />
        </Button>
      </Card>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">مفيش طلبات.</Card>
      ) : (
        visible.map((o) => {
          const open = openId === o.id;
          const shipments: Row[] = o.shipments ?? [];
          return (
            <Card key={o.id} className="overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center gap-3 p-4 text-start hover:bg-accent/40"
                onClick={() => setOpenId(open ? null : o.id)}
              >
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold">{o.code}</span>
                    <span className="text-sm">{o.customer_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {o.governorate} · {dateAr(o.created_at)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {shipments.map((s) => (
                      <Badge key={s.id} variant={statusVariant(s.status)} className="text-[10px]">
                        {s.shop_name}: {statusLabel(s.status)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-sm font-bold">{egp(o.grand_total)}</div>
              </button>

              {open && (
                <div className="space-y-4 border-t p-4">
                  <div className="grid gap-2 text-sm md:grid-cols-2">
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
                    <div className="text-muted-foreground md:col-span-2">
                      منتجات {egp(o.items_total)} + توصيل {egp(o.delivery_total)} = {egp(o.grand_total)} (
                      {o.payment_method === 'cod' ? 'دفع عند الاستلام' : o.payment_method})
                    </div>
                  </div>

                  {shipments.map((s) => {
                    const unpaid = s.status === 'delivered' && Number(s.commission_amount ?? 0) > 0 && !s.commission_paid_at;
                    return (
                      <div key={s.id} className="rounded-lg border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-semibold">{s.shop_name}</div>
                          <Badge variant={statusVariant(s.status)}>{statusLabel(s.status)}</Badge>
                        </div>
                        <ul className="mt-2 space-y-1 text-sm">
                          {(s.shipment_items ?? []).map((it: Row) => (
                            <li key={it.id} className="flex justify-between gap-2">
                              <span>
                                {itemName(it.product_name)} × {it.quantity}
                              </span>
                              <span>{egp(Number(it.unit_price) * Number(it.quantity))}</span>
                            </li>
                          ))}
                        </ul>
                        <Separator className="my-2" />
                        <div className="flex flex-wrap justify-between gap-2 text-sm">
                          <span>
                            المنتجات {egp(s.subtotal)} · التوصيل {egp(s.delivery_fee)}
                          </span>
                          {s.commission_amount != null && (
                            <span>
                              العمولة {Number(s.commission_rate)}% = {egp(s.commission_amount)}{' '}
                              {s.commission_paid_at ? '✓ مدفوعة' : '(لسه ما اتدفعتش)'}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Select
                            value={chosen[s.id] ?? s.status}
                            onValueChange={(v) => setChosen((p) => ({ ...p, [s.id]: v }))}
                          >
                            <SelectTrigger className="h-8 w-48 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ALL_SHIPMENT_STATUSES.map((st) => (
                                <SelectItem key={st} value={st}>
                                  {statusLabel(st)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            className="h-8"
                            disabled={busy === s.id || !chosen[s.id] || chosen[s.id] === s.status}
                            onClick={() => saveStatus(s)}
                          >
                            حفظ الحالة
                          </Button>
                          {unpaid && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              disabled={busy === s.id}
                              onClick={() => markPaid(s)}
                            >
                              تم استلام العمولة
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
