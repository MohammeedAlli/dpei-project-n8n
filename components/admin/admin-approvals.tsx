'use client';

import * as React from 'react';
import { Check, X, RotateCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import { egp, errMsg, type Row } from '@/lib/dashboard';

export function AdminApprovals() {
  const supabase = React.useMemo(() => createBrowserSupabaseClient(), []);
  const { toast } = useToast();

  const [products, setProducts] = React.useState<Row[]>([]);
  const [offers, setOffers] = React.useState<Row[]>([]);
  const [priceChanges, setPriceChanges] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [p, o, c] = await Promise.all([
      supabase
        .from('products')
        .select('*, shop:shops!submitted_by_shop_id(name), category:categories(name_ar), offers(id, shop_id, price, status)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('offers')
        .select('*, product:products(id, name_en, name_ar, image_url, status), shop:shops(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('offers')
        .select('*, product:products(id, name_en, name_ar, image_url), shop:shops(name)')
        .eq('status', 'approved')
        .not('pending_price', 'is', null)
        .order('updated_at', { ascending: false }),
    ]);
    const firstError = p.error ?? o.error ?? c.error;
    if (firstError) {
      toast({ title: 'تعذر تحميل الموافقات', description: firstError.message, variant: 'destructive' });
    }
    setProducts(p.data ?? []);
    // العروض الخاصة بمنتجات لسه pending بتتوافق عليها مع المنتج نفسه
    setOffers((o.data ?? []).filter((x) => x.product?.status === 'approved'));
    setPriceChanges(c.data ?? []);
    setLoading(false);
  }, [supabase, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const run = async (key: string, fn: () => Promise<void>, okMsg: string) => {
    setBusy(key);
    try {
      await fn();
      toast({ title: okMsg });
      await load();
    } catch (e) {
      toast({ title: 'تعذر تنفيذ العملية', description: errMsg(e), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const check = (res: { error: { message: string } | null }) => {
    if (res.error) throw res.error;
  };

  const approveProduct = (p: Row) =>
    run(
      `p-${p.id}`,
      async () => {
        check(await supabase.from('products').update({ status: 'approved' }).eq('id', p.id));
        check(
          await supabase
            .from('offers')
            .update({ status: 'approved' })
            .eq('product_id', p.id)
            .eq('status', 'pending')
        );
      },
      'تمت الموافقة على المنتج وعرضه'
    );

  const rejectProduct = (p: Row) =>
    run(
      `p-${p.id}`,
      async () => {
        check(await supabase.from('products').update({ status: 'rejected' }).eq('id', p.id));
        check(
          await supabase
            .from('offers')
            .update({ status: 'rejected' })
            .eq('product_id', p.id)
            .eq('status', 'pending')
        );
      },
      'تم رفض المنتج'
    );

  const setOfferStatus = (o: Row, status: 'approved' | 'rejected') =>
    run(
      `o-${o.id}`,
      async () => check(await supabase.from('offers').update({ status }).eq('id', o.id)),
      status === 'approved' ? 'تمت الموافقة على العرض' : 'تم رفض العرض'
    );

  const approvePrice = (o: Row) =>
    run(
      `c-${o.id}`,
      async () =>
        check(
          await supabase.from('offers').update({ price: o.pending_price, pending_price: null }).eq('id', o.id)
        ),
      'تم اعتماد السعر الجديد'
    );

  const rejectPrice = (o: Row) =>
    run(
      `c-${o.id}`,
      async () => check(await supabase.from('offers').update({ pending_price: null }).eq('id', o.id)),
      'تم رفض تغيير السعر'
    );

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const empty = products.length + offers.length + priceChanges.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={load}>
          <RotateCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      {empty && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          مفيش حاجة بانتظار موافقتك.
        </Card>
      )}

      {products.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-cairo text-lg font-bold">منتجات جديدة ({products.length})</h2>
          {products.map((p) => {
            const offer = (p.offers ?? []).find((x: Row) => x.status === 'pending');
            return (
              <Card key={p.id} className="flex flex-wrap gap-4 p-4">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt="" className="h-24 w-24 rounded-md border object-contain" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-md border text-xs text-muted-foreground">
                    بدون صورة
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1 text-sm">
                  <div className="font-bold">{p.name_ar}</div>
                  <div className="text-muted-foreground" dir="ltr">
                    {p.name_en}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary">المحل: {p.shop?.name ?? '—'}</Badge>
                    {p.category?.name_ar && <Badge variant="outline">{p.category.name_ar}</Badge>}
                    {p.brand && <Badge variant="outline">{p.brand}</Badge>}
                    {p.sku && <Badge variant="outline">SKU: {p.sku}</Badge>}
                    {offer && <Badge>السعر: {egp(offer.price)}</Badge>}
                  </div>
                  {p.description_ar && <p className="text-muted-foreground">{p.description_ar}</p>}
                </div>
                <div className="flex items-start gap-2">
                  <Button size="sm" disabled={busy === `p-${p.id}`} onClick={() => approveProduct(p)}>
                    <Check className="h-4 w-4" />
                    موافقة
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy === `p-${p.id}`}
                    onClick={() => rejectProduct(p)}
                  >
                    <X className="h-4 w-4" />
                    رفض
                  </Button>
                </div>
              </Card>
            );
          })}
        </section>
      )}

      {offers.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-cairo text-lg font-bold">عروض جديدة على منتجات موجودة ({offers.length})</h2>
          {offers.map((o) => (
            <Card key={o.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1 text-sm">
                <div className="font-bold">{o.product?.name_ar}</div>
                <div className="text-muted-foreground">
                  المحل: {o.shop?.name ?? '—'} · السعر المعروض: {egp(o.price)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={busy === `o-${o.id}`} onClick={() => setOfferStatus(o, 'approved')}>
                  <Check className="h-4 w-4" />
                  موافقة
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy === `o-${o.id}`}
                  onClick={() => setOfferStatus(o, 'rejected')}
                >
                  <X className="h-4 w-4" />
                  رفض
                </Button>
              </div>
            </Card>
          ))}
        </section>
      )}

      {priceChanges.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-cairo text-lg font-bold">طلبات تغيير سعر ({priceChanges.length})</h2>
          {priceChanges.map((o) => (
            <Card key={o.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1 text-sm">
                <div className="font-bold">{o.product?.name_ar}</div>
                <div className="text-muted-foreground">
                  المحل: {o.shop?.name ?? '—'} · من {egp(o.price)} إلى{' '}
                  <span className="font-bold text-foreground">{egp(o.pending_price)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={busy === `c-${o.id}`} onClick={() => approvePrice(o)}>
                  <Check className="h-4 w-4" />
                  موافقة
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy === `c-${o.id}`}
                  onClick={() => rejectPrice(o)}
                >
                  <X className="h-4 w-4" />
                  رفض
                </Button>
              </div>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
