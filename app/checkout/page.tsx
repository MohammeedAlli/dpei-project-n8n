'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Truck, Info, ShieldCheck, CreditCard } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';
import { createOrder } from '@/data/api';

const SHOP_DELIVERY_DEFAULT = 40;
const SHOP_FREE_THRESHOLD_DEFAULT = 500;

const GOVERNORATE_KEYS = [
  'cairo', 'giza', 'alexandria', 'dakahlia', 'sharqia', 'qalyubia', 'beheira',
  'monufia', 'gharbia', 'kafr_el_sheikh', 'damietta', 'port_said', 'ismailia',
  'suez', 'faiyum', 'beni_suef', 'minya', 'asyut', 'sohag', 'qena', 'luxor',
  'aswan', 'red_sea', 'new_valley', 'matrouh', 'north_sinai', 'south_sinai',
];

type ShopGroup = {
  shopId: string;
  shopName: string;
  items: Array<{ offer_id: string; product_name_en: string; product_name_ar: string; unit_price: number; quantity: number }>;
  subtotal: number;
};

export default function CheckoutPage() {
  const { lang, dir } = useLanguage();
  const { items, clear, ready } = useCart();
  const router = useRouter();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [governorate, setGovernorate] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const groups = React.useMemo(() => {
    const map = new Map<string, ShopGroup>();
    for (const item of items) {
      const g = map.get(item.shop_id) ?? {
        shopId: item.shop_id,
        shopName: item.shop_name,
        items: [],
        subtotal: 0,
      };
      g.items.push(item);
      g.subtotal += item.unit_price * item.quantity;
      map.set(item.shop_id, g);
    }
    return Array.from(map.values());
  }, [items]);

  const itemsTotal = groups.reduce((s, g) => s + g.subtotal, 0);
  const deliveryTotal = groups.reduce((s, g) => {
    if (g.subtotal >= SHOP_FREE_THRESHOLD_DEFAULT) return s;
    return s + SHOP_DELIVERY_DEFAULT;
  }, 0);
  const grandTotal = itemsTotal + deliveryTotal;

  const validatePhone = (val: string) => {
    const cleaned = val.replace(/\s|-/g, '');
    return /^(\+?2?)?01[0-2,5][0-9]{8}$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 3) {
      setError(t('checkout', 'invalidName', lang));
      return;
    }
    if (!validatePhone(phone)) {
      setError(t('checkout', 'invalidPhone', lang));
      return;
    }
    if (!governorate) {
      setError(t('checkout', 'invalidGovernorate', lang));
      return;
    }
    if (address.trim().length < 5) {
      setError(t('checkout', 'invalidAddress', lang));
      return;
    }
    if (items.length === 0) {
      setError(t('checkout', 'emptyCart', lang));
      return;
    }

    setSubmitting(true);

    try {
      const result = await createOrder({
        customer_name: name.trim(),
        phone: phone.trim(),
        governorate,
        address: address.trim(),
        notes: notes.trim() || null,
        items: items.map((i) => ({ offer_id: i.offer_id, quantity: i.quantity })),
      });

      // Success — clear cart and redirect
      clear();
      const params = new URLSearchParams({
        code: result.code,
        total: String(result.grand_total),
        shipments: String(result.shipments_count),
      });
      router.push(`/order-confirmation?${params.toString()}`);
    } catch {
      setError(t('checkout', 'orderFailed', lang));
      setSubmitting(false);
    }
  };

  if (!ready) {
    return <div className="container mx-auto px-4 py-8" />;
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-2 font-cairo text-xl font-bold">{t('checkout', 'emptyCart', lang)}</h1>
          <Link href="/products">
            <Button className="mt-4">
              {t('cart', 'continueShopping', lang)}
              <Arrow className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 font-cairo text-2xl font-bold">{t('checkout', 'title', lang)}</h1>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: form */}
        <div className="space-y-6">
          {/* Contact info */}
          <Card className="p-5 space-y-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-5 w-5 text-accent" />
              {t('checkout', 'contactInfo', lang)}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t('checkout', 'fullName', lang)}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('checkout', 'phone', lang)}</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  required
                  autoComplete="tel"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="governorate">{t('checkout', 'governorate', lang)}</Label>
              <select
                id="governorate"
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="" disabled>
                  {lang === 'ar' ? 'اختر...' : 'Select...'}
                </option>
                {GOVERNORATE_KEYS.map((g) => (
                  <option key={g} value={g}>
                    {t('governorates', g, lang)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t('checkout', 'address', lang)}</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={2}
                autoComplete="street-address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('checkout', 'notes', lang)}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </Card>

          {/* Payment */}
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold">{t('checkout', 'payment', lang)}</h2>
            <RadioGroup defaultValue="cod" className="gap-3">
              <Label
                htmlFor="cod"
                className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-accent bg-accent/5 p-4"
              >
                <RadioGroupItem value="cod" id="cod" />
                <CreditCard className="h-5 w-5 text-accent" />
                <div>
                  <div className="text-sm font-medium">{t('checkout', 'cashOnDelivery', lang)}</div>
                  <div className="text-xs text-muted-foreground">
                    {lang === 'ar' ? 'ادفع كاش عند استلام الشحنة' : 'Pay cash when you receive your shipment'}
                  </div>
                </div>
              </Label>
              <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 opacity-60">
                <div className="h-4 w-4 rounded-full border-2 border-muted" />
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('checkout', 'onlineComingSoon', lang)}</span>
              </div>
            </RadioGroup>
          </Card>

          {/* Multi-shipment notice */}
          <div className="flex items-start gap-3 rounded-lg bg-accent/5 p-4 text-sm">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <p>{t('checkout', 'multiShipmentNote', lang)}</p>
          </div>
        </div>

        {/* Right: order summary */}
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold">{t('checkout', 'summary', lang)}</h2>
            <Separator />

            {/* Shop groups */}
            <div className="space-y-4">
              {groups.map((group) => {
                const delivery =
                  group.subtotal >= SHOP_FREE_THRESHOLD_DEFAULT
                    ? 0
                    : SHOP_DELIVERY_DEFAULT;
                return (
                  <div key={group.shopId} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Truck className="h-4 w-4 text-accent" />
                      {group.shopName}
                      <Badge variant="secondary" className="text-[10px]">
                        {t('common', 'partner', lang)}
                      </Badge>
                    </div>
                    {group.items.map((it) => (
                      <div key={it.offer_id} className="flex justify-between text-xs text-muted-foreground ps-6">
                        <span className="line-clamp-1">
                          {lang === 'ar' ? it.product_name_ar : it.product_name_en} × {it.quantity}
                        </span>
                        <span>{formatEGP(it.unit_price * it.quantity, lang)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between ps-6 text-xs">
                      <span className="text-muted-foreground">{t('cart', 'delivery', lang)}</span>
                      <span>
                        {delivery === 0 ? (
                          <span className="text-accent">{t('cart', 'free', lang)}</span>
                        ) : (
                          formatEGP(delivery, lang)
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('cart', 'itemsTotal', lang)}</span>
                <span className="font-medium">{formatEGP(itemsTotal, lang)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('cart', 'deliveryTotal', lang)}</span>
                <span className="font-medium">{formatEGP(deliveryTotal, lang)}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>{t('cart', 'grandTotal', lang)}</span>
              <span className="text-accent">{formatEGP(grandTotal, lang)}</span>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                t('checkout', 'placing', lang)
              ) : (
                <>
                  {t('checkout', 'placeOrder', lang)}
                  <Arrow className="h-4 w-4" />
                </>
              )}
            </Button>
          </Card>
        </aside>
      </form>
    </div>
  );
}
