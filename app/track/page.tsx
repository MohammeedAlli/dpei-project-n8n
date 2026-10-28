'use client';

import * as React from 'react';
import { Search, Package, Truck, CheckCircle2, Clock, XCircle, AlertCircle, MapPin } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatEGP, formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getOrderByCodeAndPhone } from '@/data/api';
import type { ShipmentStatus } from '@/lib/types';
import type { OrderRecord } from '@/data/types';

type Shipment = {
  id: string;
  shop_id: string;
  shop_name: string;
  subtotal: number;
  delivery_fee: number;
  status: ShipmentStatus;
  items: Array<{ product_name: string; unit_price: number; quantity: number }>;
  created_at: string;
  updated_at: string;
};

// Timeline order for positive progress
const TIMELINE_ORDER: ShipmentStatus[] = [
  'new',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
];

const STATUS_ICON: Record<string, React.ElementType> = {
  new: Package,
  confirmed: CheckCircle2,
  preparing: Clock,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
  unavailable: XCircle,
  price_changed: AlertCircle,
  awaiting_approval: AlertCircle,
  cancelled: XCircle,
};

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  confirmed: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
  preparing: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  out_for_delivery: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  unavailable: 'bg-red-500/10 text-red-600 border-red-500/30',
  price_changed: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  awaiting_approval: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/30',
};

export default function TrackPage() {
  const { lang } = useLanguage();
  const [code, setCode] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<OrderRecord | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !phone.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const order = await getOrderByCodeAndPhone(code.trim(), phone.trim());
      if (!order) {
        setError(t('track', 'notFound', lang));
      } else {
        setData(order);
      }
    } catch {
      setError(t('common', 'error', lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 font-cairo text-2xl font-bold">{t('track', 'title', lang)}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{t('track', 'enterCredentials', lang)}</p>

        <Card className="mb-6 p-5">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">{t('track', 'orderCode', lang)}</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('track', 'placeholderCode', lang)}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('track', 'phone', lang)}</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('track', 'placeholderPhone', lang)}
                autoComplete="tel"
                required
              />
            </div>
            <Button type="submit" disabled={loading || !code.trim() || !phone.trim()} className="w-full">
              {loading ? (
                <>{t('track', 'tracking', lang)}</>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  {t('track', 'submit', lang)}
                </>
              )}
            </Button>
          </form>
        </Card>

        {error && (
          <Card className="mb-6 border-destructive/50 p-4 text-center text-sm text-destructive">
            {error}
          </Card>
        )}

        {loading && !data && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {data && <OrderResult data={data} lang={lang} />}
      </div>
    </div>
  );
}

function OrderResult({ data, lang }: { data: OrderRecord; lang: 'ar' | 'en' }) {
  const { shipments } = data;
  const order = data;

  return (
    <div className="space-y-4">
      {/* Order header */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-muted-foreground">{t('track', 'orderCode', lang)}</div>
            <div className="font-cairo text-xl font-bold">{order.code}</div>
          </div>
          <div className="text-end">
            <div className="text-sm text-muted-foreground">{t('track', 'orderDate', lang)}</div>
            <div className="text-sm font-medium">{formatDate(order.created_at, lang)}</div>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <div className="text-muted-foreground">{t('track', 'subtotal', lang)}</div>
            <div className="font-medium">{formatEGP(order.items_total, lang)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">{t('track', 'delivery', lang)}</div>
            <div className="font-medium">{formatEGP(order.delivery_total, lang)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">{t('cart', 'grandTotal', lang)}</div>
            <div className="font-bold text-accent">{formatEGP(order.grand_total, lang)}</div>
          </div>
        </div>
      </Card>

      {/* Shipments */}
      <div>
        <h2 className="mb-3 font-semibold">
          {t('track', 'shipments', lang)} ({shipments.length})
        </h2>
        <div className="space-y-4">
          {shipments.map((sh, idx) => (
            <ShipmentCard key={sh.id} shipment={sh} index={idx + 1} lang={lang} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ShipmentCard({ shipment, index, lang }: { shipment: Shipment; index: number; lang: 'ar' | 'en' }) {
  const Icon = STATUS_ICON[shipment.status] || Package;
  const colorClass = STATUS_COLOR[shipment.status] || '';
  const currentStepIdx = TIMELINE_ORDER.indexOf(shipment.status);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-accent" />
          <span className="font-medium">{shipment.shop_name}</span>
          <span className="text-xs text-muted-foreground">#{index}</span>
        </div>
        <Badge className={colorClass} variant="outline">
          <Icon className="me-1 h-3.5 w-3.5" />
          {t('shipment', shipment.status, lang)}
        </Badge>
      </div>

      <div className="p-4 space-y-4">
        {/* Items */}
        <div className="space-y-1.5">
          {shipment.items.map((it, i) => {
            const [nameEn, nameAr] = it.product_name.split('|');
            return (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="line-clamp-1">{lang === 'ar' ? nameAr || nameEn : nameEn}</span>
                <span className="text-muted-foreground">
                  {it.quantity}× {formatEGP(it.unit_price, lang)}
                </span>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Totals */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('track', 'subtotal', lang)}</span>
          <span className="font-medium">{formatEGP(shipment.subtotal, lang)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('track', 'delivery', lang)}</span>
          <span className="font-medium">
            {shipment.delivery_fee === 0 ? (
              <span className="text-accent">{t('track', 'free', lang)}</span>
            ) : (
              formatEGP(shipment.delivery_fee, lang)
            )}
          </span>
        </div>

        {/* Timeline (only for progress statuses) */}
        {currentStepIdx >= 0 && (
          <div className="pt-2">
            <div className="mb-2 text-xs font-medium text-muted-foreground">{t('track', 'timeline', lang)}</div>
            <div className="flex items-center">
              {TIMELINE_ORDER.map((step, i) => {
                const done = i <= currentStepIdx;
                const isCurrent = i === currentStepIdx;
                const StepIcon = STATUS_ICON[step];
                return (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full ${
                          done ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                        } ${isCurrent ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''}`}
                      >
                        <StepIcon className="h-3.5 w-3.5" />
                      </div>
                      <span className={`mt-1 text-[10px] ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {t('shipment', step, lang)}
                      </span>
                    </div>
                    {i < TIMELINE_ORDER.length - 1 && (
                      <div className={`mx-1 h-0.5 flex-1 ${i < currentStepIdx ? 'bg-accent' : 'bg-muted'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Delivery estimate */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {lang === 'ar' ? 'شحنة منفصلة' : 'Separate shipment'}
          </div>
        </div>
      </div>
    </Card>
  );
}
