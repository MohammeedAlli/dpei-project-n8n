'use client';

import * as React from 'react';
import { Search, ChevronDown, ChevronLeft, Copy, RotateCw } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { supabase } from '@/lib/supabase';
import { formatEGP, formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import type { ShipmentStatus } from '@/lib/types';

const SHIPMENT_STATUSES: ShipmentStatus[] = [
  'new', 'confirmed', 'preparing', 'out_for_delivery', 'delivered',
  'unavailable', 'price_changed', 'awaiting_approval', 'cancelled',
];

const WEBHOOK_STATUSES = ['pending', 'sent', 'failed', 'skipped'];

type Order = {
  id: string;
  code: string;
  customer_name: string;
  phone: string;
  governorate: string;
  address: string;
  notes: string | null;
  items_total: number;
  delivery_total: number;
  grand_total: number;
  status: string;
  created_at: string;
};

type ShopOrder = {
  id: string;
  shop_id: string;
  subtotal: number;
  delivery_fee: number;
  commission_rate_snapshot: number;
  commission_amount: number;
  status: string;
  shop_notes: string | null;
  webhook_status: string;
  webhook_error: string | null;
  created_at: string;
  shop: { name: string; contact_whatsapp: string | null };
  items: Array<{ id: string; product_name: string; unit_price: number; quantity: number }>;
};

export function AdminOrders() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [shopOrders, setShopOrders] = React.useState<ShopOrder[]>([]);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [editingNotes, setEditingNotes] = React.useState<Record<string, string>>({});
  const [statusUpdates, setStatusUpdates] = React.useState<Record<string, string>>({});

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (search.trim()) {
      query = query.ilike('code', `%${search.trim().toUpperCase()}%`);
    }
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    const { data } = await query;
    setOrders((data || []) as unknown as Order[]);
    setLoading(false);
  }, [search, statusFilter]);

  React.useEffect(() => {
    const timer = setTimeout(fetchOrders, 300);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const expandOrder = async (orderId: string) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);
    setLoadingDetail(true);
    setShopOrders([]);

    const { data: sos } = await supabase
      .from('shop_orders')
      .select('*, shop:shops(name, contact_whatsapp)')
      .eq('order_id', orderId);

    if (!sos) {
      setLoadingDetail(false);
      return;
    }

    const soIds = sos.map((s) => s.id);
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .in('shop_order_id', soIds);

    const itemsBySo: Record<string, ShopOrder['items']> = {};
    if (items) {
      for (const it of items) {
        if (!itemsBySo[it.shop_order_id]) itemsBySo[it.shop_order_id] = [];
        itemsBySo[it.shop_order_id].push({
          id: it.id,
          product_name: it.product_name,
          unit_price: Number(it.unit_price),
          quantity: it.quantity,
        });
      }
    }

    setShopOrders(
      (sos || []).map((s) => ({
        ...s,
        subtotal: Number(s.subtotal),
        delivery_fee: Number(s.delivery_fee),
        commission_rate_snapshot: Number(s.commission_rate_snapshot),
        commission_amount: Number(s.commission_amount),
        shop: s.shop,
        items: itemsBySo[s.id] || [],
      })) as unknown as ShopOrder[]
    );
    setLoadingDetail(false);
  };

  const updateShipmentStatus = async (soId: string) => {
    const newStatus = statusUpdates[soId];
    if (!newStatus) return;
    const { error } = await supabase
      .from('shop_orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', soId);
    if (error) {
      toast({ title: t('common', 'error', lang), variant: 'destructive' });
    } else {
      toast({ title: t('admin', 'saved', lang) });
      setShopOrders((prev) =>
        prev.map((s) => (s.id === soId ? { ...s, status: newStatus } : s))
      );
      setStatusUpdates((prev) => {
        const next = { ...prev };
        delete next[soId];
        return next;
      });
    }
  };

  const saveNotes = async (soId: string) => {
    const notes = editingNotes[soId];
    if (notes === undefined) return;
    const { error } = await supabase
      .from('shop_orders')
      .update({ shop_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', soId);
    if (error) {
      toast({ title: t('common', 'error', lang), variant: 'destructive' });
    } else {
      toast({ title: t('admin', 'saved', lang) });
      setShopOrders((prev) =>
        prev.map((s) => (s.id === soId ? { ...s, shop_notes: notes } : s))
      );
    }
  };

  const retryWebhook = async (soId: string) => {
    const { error } = await supabase
      .from('shop_orders')
      .update({ webhook_status: 'pending', webhook_error: null, updated_at: new Date().toISOString() })
      .eq('id', soId);
    if (error) {
      toast({ title: t('common', 'error', lang), variant: 'destructive' });
    } else {
      toast({ title: t('admin', 'saved', lang) });
      setShopOrders((prev) =>
        prev.map((s) => (s.id === soId ? { ...s, webhook_status: 'pending', webhook_error: null } : s))
      );
    }
  };

  const copyWhatsApp = (so: ShopOrder, order: Order) => {
    const [nameEn] = so.items[0]?.product_name.split('|') || [''];
    const msg =
      lang === 'ar'
        ? `طلب جديد ${order.code}\nمحل: ${so.shop.name}\nالعميل: ${order.customer_name}\nموبايل: ${order.phone}\nالعنوان: ${order.governorate} - ${order.address}\nالمنتجات:\n${so.items.map((i) => `- ${i.product_name.split('|')[0]} ×${i.quantity} = ${formatEGP(i.unit_price * i.quantity, 'ar')}`).join('\n')}\nالمجموع: ${formatEGP(so.subtotal, 'ar')}\nالتوصيل: ${formatEGP(so.delivery_fee, 'ar')}`
        : `New order ${order.code}\nShop: ${so.shop.name}\nCustomer: ${order.customer_name}\nPhone: ${order.phone}\nAddress: ${order.governorate} - ${order.address}\nItems:\n${so.items.map((i) => `- ${i.product_name.split('|')[0]} x${i.quantity} = ${formatEGP(i.unit_price * i.quantity, 'en')}`).join('\n')}\nSubtotal: ${formatEGP(so.subtotal, 'en')}\nDelivery: ${formatEGP(so.delivery_fee, 'en')}`;
    navigator.clipboard.writeText(msg);
    toast({ title: t('admin', 'copyWhatsapp', lang) });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin', 'searchOrder', lang)}
              className="ps-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('admin', 'filterStatus', lang)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin', 'allStatuses', lang)}</SelectItem>
              {SHIPMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t('shipment', s, lang)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">{t('admin', 'noOrders', lang)}</Card>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <button
                onClick={() => expandOrder(order.id)}
                className="flex w-full items-center justify-between p-4 text-start hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      expandedId === order.id ? 'rotate-180' : ''
                    }`}
                  />
                  <div>
                    <div className="font-mono text-sm font-bold">{order.code}</div>
                    <div className="text-xs text-muted-foreground">{order.customer_name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px]">
                    {t('shipment', order.status, lang) || order.status}
                  </Badge>
                  <span className="text-sm font-bold">{formatEGP(order.grand_total, lang)}</span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {formatDate(order.created_at, lang)}
                  </span>
                </div>
              </button>

              {expandedId === order.id && (
                <div className="border-t bg-muted/10 p-4">
                  {loadingDetail ? (
                    <Skeleton className="h-32" />
                  ) : (
                    <div className="space-y-3">
                      {/* Customer info */}
                      <div className="grid gap-2 text-sm sm:grid-cols-3">
                        <div>
                          <span className="text-muted-foreground">{t('admin', 'phone', lang)}: </span>
                          <span dir="ltr">{order.phone}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('admin', 'governorate', lang)}: </span>
                          <span>{t('governorates', order.governorate, lang)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('admin', 'date', lang)}: </span>
                          <span>{formatDate(order.created_at, lang)}</span>
                        </div>
                        {order.address && (
                          <div className="sm:col-span-3">
                            <span className="text-muted-foreground">{t('checkout', 'address', lang)}: </span>
                            <span>{order.address}</span>
                          </div>
                        )}
                        {order.notes && (
                          <div className="sm:col-span-3">
                            <span className="text-muted-foreground">{t('checkout', 'notes', lang)}: </span>
                            <span>{order.notes}</span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Shop orders */}
                      <div className="space-y-3">
                        {shopOrders.map((so) => (
                          <div key={so.id} className="rounded-lg border p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="font-medium">{so.shop.name}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">
                                  {t('shipment', so.status, lang)}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${
                                    so.webhook_status === 'failed'
                                      ? 'border-destructive/40 text-destructive'
                                      : so.webhook_status === 'sent'
                                      ? 'border-accent/40 text-accent'
                                      : ''
                                  }`}
                                >
                                  {t('admin', so.webhook_status, lang)}
                                </Badge>
                              </div>
                            </div>

                            {/* Items */}
                            <div className="mb-2 space-y-1">
                              {so.items.map((it) => {
                                const [nameEn, nameAr] = it.product_name.split('|');
                                return (
                                  <div key={it.id} className="flex justify-between text-xs">
                                    <span>{lang === 'ar' ? nameAr || nameEn : nameEn}</span>
                                    <span className="text-muted-foreground">
                                      {it.quantity}× {formatEGP(it.unit_price, lang)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{t('admin', 'subtotal', lang)}</span>
                              <span>{formatEGP(so.subtotal, lang)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{t('admin', 'deliveryFeeLabel', lang)}</span>
                              <span>{formatEGP(so.delivery_fee, lang)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{t('admin', 'commissionAmount', lang)}</span>
                              <span>{formatEGP(so.commission_amount, lang)} ({(so.commission_rate_snapshot * 100).toFixed(0)}%)</span>
                            </div>

                            {so.webhook_error && (
                              <div className="mt-2 rounded bg-destructive/10 p-2 text-xs text-destructive">
                                {t('admin', 'webhookError', lang)}: {so.webhook_error}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="mt-3 flex flex-wrap items-end gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">{t('admin', 'updateStatus', lang)}</Label>
                                <Select
                                  value={statusUpdates[so.id] || so.status}
                                  onValueChange={(v) =>
                                    setStatusUpdates((prev) => ({ ...prev, [so.id]: v }))
                                  }
                                >
                                  <SelectTrigger className="h-8 w-36 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SHIPMENT_STATUSES.map((s) => (
                                      <SelectItem key={s} value={s}>
                                        {t('shipment', s, lang)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {statusUpdates[so.id] && statusUpdates[so.id] !== so.status && (
                                <Button size="sm" className="h-8" onClick={() => updateShipmentStatus(so.id)}>
                                  {t('admin', 'save', lang)}
                                </Button>
                              )}

                              <div className="flex-1 space-y-1">
                                <Label className="text-xs">{t('admin', 'shopNotes', lang)}</Label>
                                <Textarea
                                  rows={1}
                                  value={editingNotes[so.id] ?? so.shop_notes ?? ''}
                                  onChange={(e) =>
                                    setEditingNotes((prev) => ({ ...prev, [so.id]: e.target.value }))
                                  }
                                  className="text-xs"
                                />
                              </div>
                              {editingNotes[so.id] !== undefined && editingNotes[so.id] !== (so.shop_notes ?? '') && (
                                <Button size="sm" variant="outline" className="h-8" onClick={() => saveNotes(so.id)}>
                                  {t('admin', 'save', lang)}
                                </Button>
                              )}

                              {so.webhook_status === 'failed' && (
                                <Button size="sm" variant="outline" className="h-8" onClick={() => retryWebhook(so.id)}>
                                  <RotateCw className="h-3 w-3" />
                                  {t('admin', 'retryWebhook', lang)}
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8"
                                onClick={() => copyWhatsApp(so, order)}
                              >
                                <Copy className="h-3 w-3" />
                                {t('admin', 'copyWhatsapp', lang)}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
