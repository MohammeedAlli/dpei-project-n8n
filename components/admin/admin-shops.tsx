'use client';

import * as React from 'react';
import { Plus, Pencil, Wallet, Save, KeyRound, Shuffle, ShieldOff, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import { egp, errMsg, SHOP_PUBLIC_COLUMNS, type Row } from '@/lib/dashboard';

const EMPTY_NEW = {
  name: '',
  slug: '',
  email: '',
  password: '',
  commission_rate: '5',
  delivery_fee: '0',
  free_delivery_threshold: '0',
  contact_whatsapp: '',
  delivery_days_text: '',
};

export function AdminShops() {
  const supabase = React.useMemo(() => createBrowserSupabaseClient(), []);
  const { toast } = useToast();

  const [shops, setShops] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [globalLimit, setGlobalLimit] = React.useState('');
  const [busy, setBusy] = React.useState<string | null>(null);

  const [editing, setEditing] = React.useState<Row | null>(null);
  const [form, setForm] = React.useState<Record<string, string>>({});

  const [mfaShops, setMfaShops] = React.useState<Set<string>>(new Set());
  const [accounts, setAccounts] = React.useState<Set<string>>(new Set());
  const [accountShop, setAccountShop] = React.useState<Row | null>(null);
  const [acc, setAcc] = React.useState({ email: '', password: '' });

  const [adding, setAdding] = React.useState(false);
  const [newShop, setNewShop] = React.useState<Record<string, string>>(EMPTY_NEW);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [overview, details, finance, settings, profiles, rates, mfa] = await Promise.all([
      supabase.rpc('admin_shops_overview'),
      supabase.from('shops').select(SHOP_PUBLIC_COLUMNS).order('name'),
      supabase.from('shop_finance').select('shop_id, commission_limit_override'),
      supabase.from('admin_settings').select('commission_limit').eq('id', 1).maybeSingle(),
      supabase.from('profiles').select('shop_id').eq('role', 'shop'),
      supabase.rpc('admin_shop_commissions'),
      supabase.rpc('admin_shops_mfa'),
    ]);
    const firstError =
      overview.error ?? details.error ?? finance.error ?? settings.error ?? profiles.error ?? rates.error;
    if (firstError) {
      toast({ title: 'تعذر تحميل المحلات', description: firstError.message, variant: 'destructive' });
    }
    const byId = new Map<string, Row>(
      (details.data ?? []).map((d: Row) => [d.id, d] as [string, Row])
    );
    const override = new Map<string, number | null>(
      (finance.data ?? []).map((f: Row) => [f.shop_id, f.commission_limit_override] as [string, number | null])
    );
    const rateById = new Map<string, number>(
      (rates.data ?? []).map((r: Row) => [r.shop_id, Number(r.commission_rate)] as [string, number])
    );
    setShops(
      (overview.data ?? []).map((o: Row) => ({
        ...byId.get(o.id),
        ...o,
        commission_rate: rateById.get(o.id) ?? 0,
        limit_override: override.get(o.id) ?? null,
      }))
    );
    setMfaShops(new Set((mfa.data ?? []).filter((x: Row) => x.has_mfa).map((x: Row) => String(x.shop_id))));
    setAccounts(new Set((profiles.data ?? []).map((x: Row) => String(x.shop_id))));
    setGlobalLimit(settings.data?.commission_limit != null ? String(settings.data.commission_limit) : '');
    setLoading(false);
  }, [supabase, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const saveGlobalLimit = async () => {
    const value = globalLimit.trim() === '' ? null : Number(globalLimit);
    if (value !== null && !(value >= 0)) {
      toast({ title: 'الرقم غير صحيح', variant: 'destructive' });
      return;
    }
    setBusy('global');
    const { error } = await supabase.from('admin_settings').update({ commission_limit: value }).eq('id', 1);
    setBusy(null);
    if (error) {
      toast({ title: 'تعذر الحفظ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم حفظ الحد العام' });
    await load();
  };

  const toggleActive = async (shop: Row, value: boolean) => {
    const { error } = await supabase.from('shops').update({ is_active: value }).eq('id', shop.id);
    if (error) {
      toast({ title: 'تعذر التعديل', description: error.message, variant: 'destructive' });
      return;
    }
    await load();
  };

  const markAllPaid = async (shop: Row) => {
    if (!window.confirm(`تسجّل إن ${shop.name} دفع كل العمولات المستحقة (${egp(shop.commission_due)})؟`)) return;
    setBusy(shop.id);
    const { error } = await supabase
      .from('shipments')
      .update({ commission_paid_at: new Date().toISOString() })
      .eq('shop_id', shop.id)
      .eq('status', 'delivered')
      .is('commission_paid_at', null);
    setBusy(null);
    if (error) {
      toast({ title: 'تعذر تسجيل الدفع', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم تسجيل الدفع' });
    await load();
  };

  const openEdit = (shop: Row) => {
    setEditing(shop);
    setForm({
      commission_rate: String(shop.commission_rate ?? 0),
      limit_override: shop.limit_override != null ? String(shop.limit_override) : '',
      delivery_fee: String(shop.delivery_fee ?? 0),
      free_delivery_threshold: String(shop.free_delivery_threshold ?? 0),
      delivery_days_text: shop.delivery_days_text ?? '',
      contact_whatsapp: shop.contact_whatsapp ?? '',
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const rate = Number(form.commission_rate);
    if (!(rate >= 0 && rate <= 100)) {
      toast({ title: 'نسبة العمولة لازم تكون بين 0 و 100', variant: 'destructive' });
      return;
    }
    const limit = form.limit_override.trim() === '' ? null : Number(form.limit_override);
    setBusy('edit');
    try {
      const r1 = await supabase.rpc('admin_set_commission_rate', { p_shop: editing.id, p_rate: rate });
      if (r1.error) throw r1.error;
      const r2 = await supabase
        .from('shops')
        .update({
          delivery_fee: Number(form.delivery_fee || 0),
          free_delivery_threshold: Number(form.free_delivery_threshold || 0),
          delivery_days_text: form.delivery_days_text.trim() || null,
          contact_whatsapp: form.contact_whatsapp.trim() || null,
        })
        .eq('id', editing.id);
      if (r2.error) throw r2.error;
      const r3 = await supabase
        .from('shop_finance')
        .update({ commission_limit_override: limit })
        .eq('shop_id', editing.id);
      if (r3.error) throw r3.error;
      toast({ title: 'تم حفظ التعديلات' });
      setEditing(null);
      await load();
    } catch (e) {
      toast({ title: 'تعذر الحفظ', description: errMsg(e), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const resetMfa = async (shop: Row) => {
    if (!window.confirm(`تمسح التحقق بخطوتين الحالي لـ ${shop.name}؟ صاحب المحل هيسجّل تطبيق جديد عند الدخول الجاي.`)) return;
    setBusy(`mfa-${shop.id}`);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/shop-mfa-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ shop_id: shop.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'تعذر إعادة الضبط');
      toast({ title: 'تم مسح التحقق بخطوتين' });
      await load();
    } catch (e) {
      toast({ title: 'تعذر إعادة الضبط', description: errMsg(e), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const openAccount = (shop: Row) => {
    setAccountShop(shop);
    setAcc({ email: '', password: '' });
  };

  const randomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint32Array(12);
    crypto.getRandomValues(bytes);
    setAcc((a) => ({ ...a, password: Array.from(bytes, (b) => chars[b % chars.length]).join('') }));
  };

  const saveAccount = async () => {
    if (!accountShop) return;
    setBusy('account');
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/shop-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ shop_id: accountShop.id, email: acc.email, password: acc.password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'تعذر الحفظ');
      toast({ title: json.created ? 'تم إنشاء حساب المحل' : 'تم تغيير كلمة المرور' });
      setAccountShop(null);
      await load();
    } catch (e) {
      toast({ title: 'تعذر الحفظ', description: errMsg(e), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const createShop = async () => {
    setBusy('create');
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/create-shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          ...newShop,
          commission_rate: Number(newShop.commission_rate),
          delivery_fee: Number(newShop.delivery_fee || 0),
          free_delivery_threshold: Number(newShop.free_delivery_threshold || 0),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'تعذر إنشاء المحل');
      toast({ title: 'تم إنشاء المحل وحساب الدخول' });
      setAdding(false);
      setNewShop(EMPTY_NEW);
      await load();
    } catch (e) {
      toast({ title: 'تعذر إنشاء المحل', description: errMsg(e), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const field = (
    values: Record<string, string>,
    set: (v: Record<string, string>) => void,
    key: string,
    label: string,
    opts: { type?: string; ltr?: boolean; placeholder?: string } = {}
  ) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type={opts.type ?? 'text'}
        dir={opts.ltr ? 'ltr' : undefined}
        placeholder={opts.placeholder}
        value={values[key] ?? ''}
        onChange={(e) => set({ ...values, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[240px] flex-1 space-y-1">
          <Label>حد العمولة غير المدفوعة (عام لكل المحلات)</Label>
          <Input
            type="number"
            min={0}
            dir="ltr"
            placeholder="فاضي = مفيش حد"
            value={globalLimit}
            onChange={(e) => setGlobalLimit(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            لو عمولة محل غير مدفوعة عدّت الرقم ده، منتجاته بتختفي من الموقع لحد ما يدفع.
          </p>
        </div>
        <Button onClick={saveGlobalLimit} disabled={busy === 'global'}>
          <Save className="h-4 w-4" />
          حفظ
        </Button>
        <Button variant="secondary" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" />
          إضافة محل
        </Button>
      </Card>

      {loading ? (
        <Skeleton className="h-48" />
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المحل</TableHead>
                <TableHead>شغال</TableHead>
                <TableHead>العمولة</TableHead>
                <TableHead>مستحق</TableHead>
                <TableHead>الحد</TableHead>
                <TableHead>مبيعات مسلّمة</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-muted-foreground" dir="ltr">
                      {s.slug}
                    </div>
                    {mfaShops.has(s.id) && (
                      <Badge variant="outline" className="mt-1 gap-1 text-[10px]">
                        <ShieldCheck className="h-3 w-3" />
                        2FA مفعّل
                      </Badge>
                    )}
                    {!accounts.has(s.id) && (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        بدون حساب دخول
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch checked={!!s.is_active} onCheckedChange={(v) => toggleActive(s, v)} />
                  </TableCell>
                  <TableCell>{Number(s.commission_rate ?? 0)}%</TableCell>
                  <TableCell>
                    <div>{egp(s.commission_due)}</div>
                    {s.debt_blocked && <Badge variant="destructive">منتجاته مخفية</Badge>}
                  </TableCell>
                  <TableCell>{s.limit_amount != null ? egp(s.limit_amount) : '—'}</TableCell>
                  <TableCell>
                    {egp(s.delivered_sales)}
                    <div className="text-xs text-muted-foreground">{Number(s.delivered_shipments)} شحنة</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                        <Pencil className="h-4 w-4" />
                        تعديل
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openAccount(s)}>
                        <KeyRound className="h-4 w-4" />
                        {accounts.has(s.id) ? 'كلمة المرور' : 'إنشاء حساب'}
                      </Button>
                      {mfaShops.has(s.id) && (
                        <Button size="sm" variant="outline" disabled={busy === `mfa-${s.id}`} onClick={() => resetMfa(s)}>
                          <ShieldOff className="h-4 w-4" />
                          مسح 2FA
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === s.id || Number(s.commission_due) <= 0}
                        onClick={() => markAllPaid(s)}
                      >
                        <Wallet className="h-4 w-4" />
                        تم الدفع
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* تعديل محل */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل {editing?.name}</DialogTitle>
            <DialogDescription>نسبة العمولة بالمئة (5 = 5%) وبتتحسب على سعر المنتجات من غير التوصيل.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            {field(form, setForm, 'commission_rate', 'نسبة العمولة %', { type: 'number', ltr: true })}
            {field(form, setForm, 'limit_override', 'حد خاص بالمحل (فاضي = العام)', { type: 'number', ltr: true })}
            {field(form, setForm, 'delivery_fee', 'رسوم التوصيل', { type: 'number', ltr: true })}
            {field(form, setForm, 'free_delivery_threshold', 'توصيل مجاني فوق', { type: 'number', ltr: true })}
            {field(form, setForm, 'delivery_days_text', 'مدة التوصيل (نص)')}
            {field(form, setForm, 'contact_whatsapp', 'واتساب المحل', { ltr: true })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              إلغاء
            </Button>
            <Button onClick={saveEdit} disabled={busy === 'edit'}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حساب دخول المحل */}
      <Dialog open={!!accountShop} onOpenChange={(o) => !o && setAccountShop(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {accountShop && accounts.has(accountShop.id) ? 'تغيير كلمة مرور' : 'إنشاء حساب دخول'}{' '}
              {accountShop?.name}
            </DialogTitle>
            <DialogDescription>
              {accountShop && accounts.has(accountShop.id)
                ? 'اكتب كلمة مرور جديدة (والإيميل لو عايز تغيّره، أو سيبه فاضي).'
                : 'اسم المستخدم هو الإيميل. اكتب إيميل صاحب المحل وكلمة مرور، وابعتهم له مع رابط /login.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>الإيميل (اسم المستخدم)</Label>
              <Input
                type="email"
                dir="ltr"
                value={acc.email}
                onChange={(e) => setAcc({ ...acc, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>كلمة المرور (8 حروف على الأقل)</Label>
              <div className="flex gap-2">
                <Input
                  dir="ltr"
                  value={acc.password}
                  onChange={(e) => setAcc({ ...acc, password: e.target.value })}
                />
                <Button type="button" variant="outline" onClick={randomPassword}>
                  <Shuffle className="h-4 w-4" />
                  توليد
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountShop(null)}>
              إلغاء
            </Button>
            <Button onClick={saveAccount} disabled={busy === 'account'}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* إضافة محل */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة محل جديد</DialogTitle>
            <DialogDescription>هيتعمل للمحل حساب دخول بالإيميل وكلمة المرور دول.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            {field(newShop, setNewShop, 'name', 'اسم المحل')}
            {field(newShop, setNewShop, 'slug', 'اسم مختصر بالإنجليزي', { ltr: true, placeholder: 'my-shop' })}
            {field(newShop, setNewShop, 'email', 'إيميل الدخول', { type: 'email', ltr: true })}
            {field(newShop, setNewShop, 'password', 'كلمة المرور (8 حروف على الأقل)', { type: 'text', ltr: true })}
            {field(newShop, setNewShop, 'commission_rate', 'نسبة العمولة %', { type: 'number', ltr: true })}
            {field(newShop, setNewShop, 'delivery_fee', 'رسوم التوصيل', { type: 'number', ltr: true })}
            {field(newShop, setNewShop, 'free_delivery_threshold', 'توصيل مجاني فوق', { type: 'number', ltr: true })}
            {field(newShop, setNewShop, 'contact_whatsapp', 'واتساب المحل', { ltr: true })}
            {field(newShop, setNewShop, 'delivery_days_text', 'مدة التوصيل (نص)')}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(false)}>
              إلغاء
            </Button>
            <Button onClick={createShop} disabled={busy === 'create'}>
              {busy === 'create' ? 'جاري الإنشاء...' : 'إنشاء المحل'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
