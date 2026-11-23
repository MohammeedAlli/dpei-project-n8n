'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Info, Loader2, Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';

const MAX_ROWS = 200;
const MAX_FILE_MB = 5;

type Cat = { id: string; name_ar: string | null; name_en: string | null; slug: string | null };
type Item = {
  line: number;
  name_ar: string;
  name_en: string;
  category_id: string | null;
  categoryRaw: string;
  price: number;
  image_url: string | null;
  brand: string | null;
  sku: string | null;
  description_ar: string | null;
  description_en: string | null;
  in_stock: boolean;
  errors: string[];
  warnings: string[];
};

// ---------------------------------------------------------------- headers
const norm = (s: unknown) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\s_\-.:*()]/g, '');

const ALIASES: Record<string, string[]> = {
  name_ar: ['name_ar', 'الاسم بالعربي', 'اسم المنتج بالعربي', 'الاسم عربي', 'اسم عربي'],
  name_en: ['name_en', 'الاسم بالانجليزي', 'الاسم بالإنجليزي', 'اسم المنتج بالانجليزي', 'الاسم انجليزي', 'اسم انجليزي'],
  category: ['category', 'القسم', 'الصنف', 'التصنيف', 'الفئة'],
  price: ['price', 'السعر', 'سعر', 'سعرك'],
  image_url: ['image_url', 'image', 'رابط الصورة', 'الصورة', 'صورة', 'لينك الصورة'],
  brand: ['brand', 'الماركة', 'الماركه'],
  sku: ['sku', 'كود المنتج', 'الكود'],
  description_ar: ['description_ar', 'الوصف بالعربي', 'وصف عربي'],
  description_en: ['description_en', 'الوصف بالانجليزي', 'الوصف بالإنجليزي', 'وصف انجليزي'],
  in_stock: ['in_stock', 'متوفر', 'التوفر', 'الحالة'],
};
const ALIAS_INDEX = new Map<string, string>();
for (const [key, list] of Object.entries(ALIASES)) for (const a of list) ALIAS_INDEX.set(norm(a), key);

const REQUIRED: Array<[string, string]> = [
  ['name_ar', 'الاسم بالعربي'],
  ['name_en', 'الاسم بالإنجليزي'],
  ['category', 'القسم'],
  ['price', 'السعر'],
  ['image_url', 'رابط الصورة'],
];

// ---------------------------------------------------------------- file reading
function parseCsv(text: string): string[][] {
  const t = text.replace(/^﻿/, '');
  const first = t.split(/\r?\n/, 1)[0] ?? '';
  const delim = [',', ';', '\t'].map((d) => [d, first.split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) {
      if (ch === '"' && t[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && t[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

async function readRows(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return parseCsv(await file.text());
  if (name.endsWith('.xlsx')) {
    const { default: readXlsxFile } = await import('read-excel-file');
    const rows = await readXlsxFile(file);
    return rows.map((r) => r.map((c) => (c == null ? '' : String(c))));
  }
  throw new Error('نوع الملف غير مدعوم. ارفع ملف .xlsx أو .csv');
}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
function toNumber(raw: string): number {
  const s = raw.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d))).replace(/٫/g, '.').replace(/٬/g, ',');
  const m = s.match(/\d[\d,]*(?:\.\d+)?/);
  if (!m) return NaN;
  let n = m[0];
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(n)) n = n.replace(/,/g, '');
  else n = n.replace(',', '.');
  return Number(n);
}

function toStock(raw: string): boolean {
  const v = norm(raw);
  if (!v) return true;
  return !['لا', 'no', 'n', '0', 'false', 'غيرمتوفر', 'خلص', 'خالص', 'نافذ'].includes(v);
}

// ---------------------------------------------------------------- validate
function buildItems(rows: string[][], cats: Cat[]): { items: Item[]; headerError: string | null } {
  if (rows.length < 2) return { items: [], headerError: 'الملف فاضي. لازم يكون فيه صف عناوين وصف منتج على الأقل.' };
  const header = rows[0].map((h) => ALIAS_INDEX.get(norm(h)) ?? '');
  const idx: Record<string, number> = {};
  header.forEach((k, i) => {
    if (k && !(k in idx)) idx[k] = i;
  });
  const missing = REQUIRED.filter(([k]) => !(k in idx)).map(([, label]) => label);
  if (missing.length) return { items: [], headerError: `أعمدة ناقصة في الملف: ${missing.join('، ')}. اتأكد إن أول صف هو عناوين الأعمدة.` };

  const byName = new Map<string, string>();
  for (const c of cats) for (const n of [c.name_ar, c.name_en, c.slug]) if (n) byName.set(norm(n), c.id);

  const data = rows.slice(1).filter((r) => r.some((c) => String(c ?? '').trim() !== ''));
  const seen = new Set<string>();
  const items = data.map((r, n): Item => {
    const get = (k: string) => (k in idx ? String(r[idx[k]] ?? '').trim() : '');
    const errors: string[] = [];
    const warnings: string[] = [];
    const name_ar = get('name_ar');
    const name_en = get('name_en');
    const categoryRaw = get('category');
    const price = toNumber(get('price'));
    const image = get('image_url');
    const sku = get('sku');

    if (name_ar.length < 2 || name_ar.length > 200) errors.push('الاسم بالعربي ناقص أو طويل');
    if (name_en.length < 2 || name_en.length > 200) errors.push('الاسم بالإنجليزي ناقص أو طويل');
    const category_id = categoryRaw ? byName.get(norm(categoryRaw)) ?? null : null;
    if (!categoryRaw) errors.push('القسم ناقص');
    else if (!category_id) errors.push(`القسم "${categoryRaw}" مش موجود`);
    if (!(price > 0) || price > 1_000_000) errors.push('السعر لازم يكون رقم أكبر من صفر');

    let image_url: string | null = null;
    if (!image) warnings.push('من غير صورة');
    else if (!/^https:\/\/[^\s]+$/i.test(image) || image.length > 500) warnings.push('رابط الصورة لازم يبدأ بـ https وهيتشال');
    else image_url = image;

    if (sku.length > 64) errors.push('كود المنتج طويل');
    const dKey = `${norm(name_en)}|${norm(get('brand'))}`;
    if (seen.has(dKey)) errors.push('مكرر في الملف');
    seen.add(dKey);

    const dAr = get('description_ar');
    const dEn = get('description_en');
    if (dAr.length > 2000 || dEn.length > 2000) errors.push('الوصف أطول من 2000 حرف');

    return {
      line: n + 2,
      name_ar,
      name_en,
      category_id,
      categoryRaw,
      price,
      image_url,
      brand: get('brand').slice(0, 100) || null,
      sku: sku || null,
      description_ar: dAr || null,
      description_en: dEn || null,
      in_stock: toStock(get('in_stock')),
      errors,
      warnings,
    };
  });
  return { items, headerError: null };
}

async function pool<T>(list: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, list.length) }, async () => {
      while (i < list.length) await fn(list[i++]);
    })
  );
}

// ---------------------------------------------------------------- component
export function ShopBulkUpload({ shopId, onDone }: { shopId: string; onDone: () => void }) {
  const supabase = React.useMemo(() => createBrowserSupabaseClient(), []);
  const { toast } = useToast();
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [cats, setCats] = React.useState<Cat[]>([]);
  const [items, setItems] = React.useState<Item[]>([]);
  const [fileName, setFileName] = React.useState('');
  const [headerError, setHeaderError] = React.useState<string | null>(null);
  const [reading, setReading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [failed, setFailed] = React.useState<Array<{ line: number; name: string; msg: string }>>([]);
  const [okCount, setOkCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    supabase
      .from('categories')
      .select('id, name_ar, name_en, slug')
      .order('sort_order')
      .then(({ data }) => setCats((data ?? []) as Cat[]));
  }, [supabase]);

  const reset = () => {
    setItems([]);
    setFileName('');
    setHeaderError(null);
    setFailed([]);
    setOkCount(null);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    reset();
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setHeaderError(`الملف أكبر من ${MAX_FILE_MB} ميجا`);
      return;
    }
    setReading(true);
    setFileName(file.name);
    try {
      const rows = await readRows(file);
      const res = buildItems(rows, cats);
      if (res.items.length > MAX_ROWS) {
        setHeaderError(`الملف فيه ${res.items.length} منتج. الحد الأقصى ${MAX_ROWS} منتج في المرة، قسّمه على أكتر من ملف.`);
      } else {
        setHeaderError(res.headerError);
        setItems(res.items);
      }
    } catch (err) {
      setHeaderError(err instanceof Error ? err.message : 'تعذر قراءة الملف');
    } finally {
      setReading(false);
    }
  };

  const valid = items.filter((i) => i.errors.length === 0);
  const invalid = items.length - valid.length;

  const send = async () => {
    if (!valid.length || sending) return;
    setSending(true);
    setFailed([]);
    setProgress(0);
    const bad: Array<{ line: number; name: string; msg: string }> = [];
    let ok = 0;
    let done = 0;
    await pool(valid, 3, async (it) => {
      try {
        const p = await supabase
          .from('products')
          .insert({
            name_ar: it.name_ar,
            name_en: it.name_en,
            brand: it.brand,
            sku: it.sku,
            category_id: it.category_id,
            description_ar: it.description_ar,
            description_en: it.description_en,
            image_url: it.image_url,
            status: 'pending',
            submitted_by_shop_id: shopId,
          })
          .select('id')
          .single();
        if (p.error) throw p.error;
        const o = await supabase
          .from('offers')
          .insert({ product_id: p.data.id, shop_id: shopId, price: it.price, in_stock: it.in_stock, status: 'pending' });
        if (o.error) throw new Error('المنتج اتسجل لكن العرض فشل: ' + o.error.message);
        ok++;
      } catch (err) {
        bad.push({ line: it.line, name: it.name_ar, msg: err instanceof Error ? err.message : String((err as { message?: string })?.message ?? 'فشل') });
      } finally {
        done++;
        setProgress(Math.round((done / valid.length) * 100));
      }
    });
    setSending(false);
    setOkCount(ok);
    setFailed(bad.sort((a, b) => a.line - b.line));
    if (ok) {
      toast({ title: `تم إرسال ${ok} منتج للموافقة`, description: 'هيظهروا على الموقع بعد ما الأدمن يوافق.' });
      onDone();
    }
  };

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-cairo text-lg font-bold">
            <FileSpreadsheet className="h-5 w-5 text-accent" />
            رفع منتجات كتير مرة واحدة (Excel)
          </h2>
          <p className="text-sm text-muted-foreground">لو عندك منتجات كتير، ارفع شيت Excel بدل ما تضيفهم واحد واحد.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href="/templates/products-template.xlsx" download="products-template.xlsx">
            <Download className="h-4 w-4" />
            تنزيل نموذج Excel جاهز
          </a>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.csv"
          onChange={onFile}
          disabled={sending || reading || cats.length === 0}
          className="text-sm"
          aria-label="ملف المنتجات"
        />
        {reading && <Loader2 className="h-4 w-4 animate-spin" />}
        {fileName && !sending && (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            مسح الملف
          </Button>
        )}
      </div>

      {/* the notice under the upload */}
      <div className="flex gap-3 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm" role="note">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <div className="space-y-2">
          <p className="font-semibold">الملف لازم يحتوي على الأعمدة دي (أول صف = عناوين الأعمدة):</p>
          <ul className="list-disc space-y-1 ps-5">
            <li>
              <b>إجباري:</b> الاسم بالعربي، الاسم بالإنجليزي، القسم، السعر، رابط الصورة.
            </li>
            <li>اختياري: الماركة، كود المنتج (SKU)، الوصف بالعربي، الوصف بالإنجليزي، متوفر (نعم / لا).</li>
            <li>
              رابط الصورة لازم يبدأ بـ <bdi dir="ltr">https://</bdi> ويفتح الصورة مباشرة. المنتج من غير صورة بيتبعت، بس الأفضل تحط صورة.
            </li>
            <li>
              اسم القسم لازم يطابق واحد من دول:{' '}
              {cats.map((c) => (
                <Badge key={c.id} variant="outline" className="me-1 mt-1">
                  {c.name_ar}
                </Badge>
              ))}
            </li>
            <li>
              الحد الأقصى {MAX_ROWS} منتج و{MAX_FILE_MB} ميجا في المرة، والملف .xlsx أو .csv. اتأكد إن كل منتج في صف لوحده.
            </li>
            <li>المنتجات بتتراجع من الأدمن قبل ما تظهر على الموقع، زي المنتج المفرد.</li>
          </ul>
        </div>
      </div>

      {headerError && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {headerError}
        </p>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge>{valid.length} جاهز</Badge>
            {invalid > 0 && <Badge variant="destructive">{invalid} فيه أخطاء (مش هيتبعت)</Badge>}
            <span className="text-muted-foreground">من {items.length} منتج في الملف</span>
          </div>

          <div className="max-h-80 overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>صف</TableHead>
                  <TableHead>المنتج</TableHead>
                  <TableHead>القسم</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.slice(0, 100).map((it) => (
                  <TableRow key={it.line}>
                    <TableCell dir="ltr">{it.line}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{it.name_ar || '—'}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">
                        {it.name_en}
                      </div>
                    </TableCell>
                    <TableCell>{it.categoryRaw || '—'}</TableCell>
                    <TableCell dir="ltr">{it.price > 0 ? it.price : '—'}</TableCell>
                    <TableCell className="text-xs">
                      {it.errors.length ? (
                        <span className="text-destructive">{it.errors.join(' · ')}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          جاهز
                        </span>
                      )}
                      {it.warnings.length > 0 && <div className="text-amber-600">{it.warnings.join(' · ')}</div>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {items.length > 100 && <p className="text-xs text-muted-foreground">بنعرض أول 100 صف بس، لكن كل الصفوف الجاهزة هتتبعت.</p>}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={send} disabled={sending || valid.length === 0 || okCount !== null}>
              {sending ? `جاري الإرسال... ${progress}%` : `إرسال ${valid.length} منتج للموافقة`}
            </Button>
            {sending && (
              <div className="h-2 w-40 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </div>
      )}

      {okCount !== null && (
        <div className="space-y-2 text-sm" aria-live="polite">
          <p className="flex items-center gap-2 font-semibold text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            تم إرسال {okCount} منتج للموافقة{failed.length ? `، وفشل ${failed.length}` : ''}.
          </p>
          {failed.length > 0 && (
            <ul className="list-disc space-y-1 ps-5 text-destructive">
              {failed.map((f) => (
                <li key={f.line}>
                  صف {f.line} ({f.name}): {f.msg}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
