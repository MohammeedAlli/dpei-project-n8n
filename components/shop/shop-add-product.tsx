'use client';

import * as React from 'react';
import { ImagePlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import { errMsg, type Row } from '@/lib/dashboard';
import { ShopBulkUpload } from '@/components/shop/shop-bulk-upload';

const MAX_IMAGE_MB = 3;

const EMPTY = {
  name_ar: '',
  name_en: '',
  brand: '',
  sku: '',
  category_id: '',
  description_ar: '',
  description_en: '',
  price: '',
};

export function ShopAddProduct({ shopId, onDone }: { shopId: string; onDone: () => void }) {
  const supabase = React.useMemo(() => createBrowserSupabaseClient(), []);
  const { toast } = useToast();

  const [categories, setCategories] = React.useState<Row[]>([]);
  const [form, setForm] = React.useState<Record<string, string>>(EMPTY);
  const [inStock, setInStock] = React.useState(true);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    supabase
      .from('categories')
      .select('id, name_ar, name_en')
      .order('sort_order')
      .then(({ data }) => setCategories(data ?? []));
  }, [supabase]);

  React.useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.price);
    if (form.name_ar.trim().length < 2 || form.name_en.trim().length < 2) {
      toast({ title: 'اكتب اسم المنتج بالعربي والإنجليزي', variant: 'destructive' });
      return;
    }
    if (!(price > 0)) {
      toast({ title: 'اكتب سعر صحيح', variant: 'destructive' });
      return;
    }
    if (file && file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast({ title: `الصورة أكبر من ${MAX_IMAGE_MB} ميجا`, variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // 1) رفع الصورة (جوه فولدر المحل)
      let imageUrl: string | null = null;
      if (file) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        const path = `${shopId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const up = await supabase.storage
          .from('product-images')
          .upload(path, file, { contentType: file.type, upsert: false });
        if (up.error) throw up.error;
        imageUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
      }

      // 2) المنتج (دايما بانتظار موافقتك)
      const product = await supabase
        .from('products')
        .insert({
          name_ar: form.name_ar.trim(),
          name_en: form.name_en.trim(),
          brand: form.brand.trim() || null,
          sku: form.sku.trim() || null,
          category_id: form.category_id || null,
          description_ar: form.description_ar.trim() || null,
          description_en: form.description_en.trim() || null,
          image_url: imageUrl,
          status: 'pending',
          submitted_by_shop_id: shopId,
        })
        .select('id')
        .single();
      if (product.error) throw product.error;

      // 3) عرض المحل على المنتج
      const offer = await supabase.from('offers').insert({
        product_id: product.data.id,
        shop_id: shopId,
        price,
        in_stock: inStock,
        status: 'pending',
      });
      if (offer.error) throw offer.error;

      toast({ title: 'تم إرسال المنتج للموافقة', description: 'هيظهر على الموقع بعد ما الأدمن يوافق.' });
      setForm(EMPTY);
      setFile(null);
      setInStock(true);
      if (fileRef.current) fileRef.current.value = '';
      onDone();
    } catch (err) {
      toast({ title: 'تعذر إضافة المنتج', description: errMsg(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
    <Card className="p-5">
      <p className="mb-4 text-sm text-muted-foreground">
        المنتج الجديد بيتراجع من الأدمن قبل ما يظهر على الموقع.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="name_ar">اسم المنتج بالعربي *</Label>
            <Input id="name_ar" value={form.name_ar} onChange={set('name_ar')} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="name_en">اسم المنتج بالإنجليزي *</Label>
            <Input id="name_en" value={form.name_en} onChange={set('name_en')} dir="ltr" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="brand">الماركة</Label>
            <Input id="brand" value={form.brand} onChange={set('brand')} dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sku">كود المنتج (SKU)</Label>
            <Input id="sku" value={form.sku} onChange={set('sku')} dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label>القسم</Label>
            <Select value={form.category_id} onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="اختار القسم" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="price">سعرك (ج.م) *</Label>
            <Input id="price" type="number" min={0} step="0.01" dir="ltr" value={form.price} onChange={set('price')} required />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="description_ar">الوصف بالعربي</Label>
            <Textarea id="description_ar" rows={3} value={form.description_ar} onChange={set('description_ar')} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="description_en">الوصف بالإنجليزي</Label>
            <Textarea id="description_en" rows={3} dir="ltr" value={form.description_en} onChange={set('description_en')} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>صورة المنتج (حتى {MAX_IMAGE_MB} ميجا)</Label>
          <div className="flex items-center gap-4">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-24 w-24 rounded-md border object-contain" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-md border text-muted-foreground">
                <ImagePlus className="h-6 w-6" />
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Switch checked={inStock} onCheckedChange={setInStock} />
          متوفر في المحل
        </label>

        <Button type="submit" disabled={saving}>
          {saving ? 'جاري الإرسال...' : 'إرسال المنتج للموافقة'}
        </Button>
      </form>
    </Card>
    <ShopBulkUpload shopId={shopId} onDone={onDone} />
    </div>
  );
}
