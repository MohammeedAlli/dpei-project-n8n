'use client';

import * as React from 'react';
import { RotateCw, Search, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import { cleanSearch, egp, type Row } from '@/lib/dashboard';

const OFFER_STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  approved: { label: 'معروض', variant: 'default' },
  pending: { label: 'بانتظار الموافقة', variant: 'secondary' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
};

export function ShopProducts({ shopId, reloadKey = 0 }: { shopId: string; reloadKey?: number }) {
  const supabase = React.useMemo(() => createBrowserSupabaseClient(), []);
  const { toast } = useToast();

  const [offers, setOffers] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [prices, setPrices] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState<string | null>(null);

  // إضافة عرض على منتج موجود
  const [q, setQ] = React.useState('');
  const [results, setResults] = React.useState<Row[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [newPrices, setNewPrices] = React.useState<Record<string, string>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('offers')
      .select('*, product:products(id, name_en, name_ar, image_url, sku, brand)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'تعذر تحميل منتجاتك', description: error.message, variant: 'destructive' });
    }
    setOffers(data ?? []);
    setLoading(false);
  }, [supabase, shopId, toast]);

  React.useEffect(() => {
    load();
  }, [load, reloadKey]);

  const toggleStock = async (o: Row, value: boolean) => {
    setBusy(o.id);
    const { error } = await supabase.from('offers').update({ in_stock: value }).eq('id', o.id);
    setBusy(null);
    if (error) {
      toast({ title: 'تعذر التعديل', description: error.message, variant: 'destructive' });
      return;
    }
    setOffers((prev) => prev.map((x) => (x.id === o.id ? { ...x, in_stock: value } : x)));
  };

  const savePrice = async (o: Row) => {
    const value = Number(prices[o.id]);
    if (!(value > 0)) {
      toast({ title: 'اكتب سعر صحيح', variant: 'destructive' });
      return;
    }
    setBusy(o.id);
    // عرض لسه بانتظار الموافقة: السعر بيتغير مباشرة. عرض معتمد: السعر الجديد بيستنى موافقتك.
    const patch = o.status === 'pending' ? { price: value } : { pending_price: value };
    const { error } = await supabase.from('offers').update(patch).eq('id', o.id);
    setBusy(null);
    if (error) {
      toast({ title: 'تعذر حفظ السعر', description: error.message, variant: 'destructive' });
      return;
    }
    toast({
      title: o.status === 'pending' ? 'تم تعديل السعر' : 'تم إرسال السعر الجديد للموافقة',
    });
    setPrices((p) => {
      const copy = { ...p };
      delete copy[o.id];
      return copy;
    });
    await load();
  };

  const search = async () => {
    const s = cleanSearch(q);
    if (s.length < 2) return;
    setSearching(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name_en, name_ar, image_url, brand')
      .eq('status', 'approved')
      .or(`name_en.ilike.%${s}%,name_ar.ilike.%${s}%`)
      .limit(8);
    setSearching(false);
    if (error) {
      toast({ title: 'تعذر البحث', description: error.message, variant: 'destructive' });
      return;
    }
    const mine = new Set(offers.map((o) => o.product_id));
    setResults((data ?? []).filter((p) => !mine.has(p.id)));
  };

  const addOffer = async (p: Row) => {
    const price = Number(newPrices[p.id]);
    if (!(price > 0)) {
      toast({ title: 'اكتب سعرك الأول', variant: 'destructive' });
      return;
    }
    setBusy(`new-${p.id}`);
    const { error } = await supabase
      .from('offers')
      .insert({ product_id: p.id, shop_id: shopId, price, in_stock: true, status: 'pending' });
    setBusy(null);
    if (error) {
      toast({ title: 'تعذر إضافة العرض', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم إرسال العرض للموافقة' });
    setResults((r) => r.filter((x) => x.id !== p.id));
    await load();
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-3 p-4">
        <h2 className="font-cairo font-bold">عندك منتج موجود على الموقع؟ ضيف عرضك عليه</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم المنتج" className="ps-9" />
          </div>
          <Button type="submit" disabled={searching}>
            بحث
          </Button>
        </form>
        {results.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
            {p.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image_url} alt="" className="h-12 w-12 rounded border object-contain" />
            ) : null}
            <div className="min-w-0 flex-1 text-sm">
              <div className="font-semibold">{p.name_ar}</div>
              <div className="text-xs text-muted-foreground" dir="ltr">
                {p.name_en}
              </div>
            </div>
            <Input
              type="number"
              min={0}
              dir="ltr"
              placeholder="سعرك"
              className="w-28"
              value={newPrices[p.id] ?? ''}
              onChange={(e) => setNewPrices((prev) => ({ ...prev, [p.id]: e.target.value }))}
            />
            <Button size="sm" disabled={busy === `new-${p.id}`} onClick={() => addOffer(p)}>
              <Plus className="h-4 w-4" />
              أضف عرضي
            </Button>
          </div>
        ))}
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="font-cairo text-lg font-bold">منتجاتي ({offers.length})</h2>
        <Button variant="outline" size="sm" onClick={load}>
          <RotateCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-32" />
      ) : offers.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">لسه مفيش منتجات. أضف منتج من تبويب «إضافة منتج».</Card>
      ) : (
        offers.map((o) => {
          const st = OFFER_STATUS[o.status] ?? { label: o.status, variant: 'outline' as const };
          return (
            <Card key={o.id} className="flex flex-wrap items-center gap-4 p-4">
              {o.product?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.product.image_url} alt="" className="h-16 w-16 rounded border object-contain" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded border text-[10px] text-muted-foreground">
                  بدون صورة
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1 text-sm">
                <div className="font-semibold">{o.product?.name_ar}</div>
                <div className="text-xs text-muted-foreground" dir="ltr">
                  {o.product?.name_en}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={st.variant}>{st.label}</Badge>
                  <span className="font-bold">{egp(o.price)}</span>
                  {o.pending_price != null && (
                    <Badge variant="outline">سعر جديد بانتظار الموافقة: {egp(o.pending_price)}</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  dir="ltr"
                  placeholder="سعر جديد"
                  className="w-28"
                  value={prices[o.id] ?? ''}
                  onChange={(e) => setPrices((p) => ({ ...p, [o.id]: e.target.value }))}
                />
                <Button size="sm" variant="outline" disabled={busy === o.id || !prices[o.id]} onClick={() => savePrice(o)}>
                  حفظ السعر
                </Button>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={!!o.in_stock} disabled={busy === o.id} onCheckedChange={(v) => toggleStock(o, v)} />
                متوفر
              </label>
            </Card>
          );
        })
      )}
    </div>
  );
}
