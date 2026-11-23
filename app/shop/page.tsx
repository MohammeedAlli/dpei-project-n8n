'use client';

import * as React from 'react';
import { Store, ShoppingBag, Package, PlusCircle, Wallet } from 'lucide-react';
import { LogoutButton } from '@/components/auth/logout-button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShopOrders } from '@/components/shop/shop-orders';
import { ShopProducts } from '@/components/shop/shop-products';
import { ShopAddProduct } from '@/components/shop/shop-add-product';
import { ShopCommission } from '@/components/shop/shop-commission';
import { fetchProfile } from '@/lib/auth/profile';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';

export default function ShopPage() {
  const supabase = React.useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = React.useState<string | null>(null);
  const [shopId, setShopId] = React.useState<string | null>(null);
  const [shopName, setShopName] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState('orders');
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (alive) setLoading(false);
        return;
      }
      const profile = await fetchProfile(supabase, user.id);
      let name = '';
      if (profile?.shop_id) {
        const { data } = await supabase.from('shops').select('name').eq('id', profile.shop_id).maybeSingle();
        name = data?.name ?? '';
      }
      if (!alive) return;
      setEmail(user.email ?? null);
      setShopId(profile?.shop_id ?? null);
      setShopName(name);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [supabase]);

  return (
    <div className="container mx-auto px-4 py-6" dir="rtl" lang="ar">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-cairo text-xl font-bold">لوحة المحل{shopName ? `: ${shopName}` : ''}</h1>
            {email && <p className="text-xs text-muted-foreground">{email}</p>}
          </div>
        </div>
        <LogoutButton />
      </div>

      {loading ? (
        <Skeleton className="h-40" />
      ) : !shopId ? (
        <Card className="p-6 text-sm text-destructive">حسابك غير مربوط بمحل. كلّم الأدمن.</Card>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4 flex h-auto flex-wrap">
            <TabsTrigger value="orders" className="gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              الطلبات
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-1.5">
              <Package className="h-4 w-4" />
              منتجاتي
            </TabsTrigger>
            <TabsTrigger value="add" className="gap-1.5">
              <PlusCircle className="h-4 w-4" />
              إضافة منتج
            </TabsTrigger>
            <TabsTrigger value="commission" className="gap-1.5">
              <Wallet className="h-4 w-4" />
              العمولة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <ShopOrders />
          </TabsContent>
          <TabsContent value="products">
            <ShopProducts shopId={shopId} reloadKey={reloadKey} />
          </TabsContent>
          <TabsContent value="add">
            <ShopAddProduct
              shopId={shopId}
              onDone={() => {
                setReloadKey((k) => k + 1);
                setTab('products');
              }}
            />
          </TabsContent>
          <TabsContent value="commission">
            <ShopCommission />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
