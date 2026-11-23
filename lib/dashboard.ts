import { formatEGP, formatDate } from '@/lib/format';

// صف جاي من Supabase (الأعمدة بتتحدد من الاستعلام نفسه)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  new: 'جديد',
  confirmed: 'تم التأكيد',
  preparing: 'جاري التجهيز',
  out_for_delivery: 'خرج للتوصيل',
  delivered: 'تم التسليم',
  unavailable: 'غير متوفر',
  price_changed: 'السعر اتغير',
  awaiting_approval: 'بانتظار موافقة العميل',
  cancelled: 'ملغي',
};

export const ALL_SHIPMENT_STATUSES = Object.keys(SHIPMENT_STATUS_LABELS);

// الحالات اللي المحل يقدر يختارها (لازم تطابق الملف C في Supabase)
export const SHOP_ALLOWED_STATUSES = ['confirmed', 'preparing', 'out_for_delivery', 'unavailable'];
// شحنة وصلت لواحدة من دول: المحل مايقدرش يغيّرها
export const SHOP_LOCKED_STATUSES = ['delivered', 'cancelled'];

export const statusLabel = (s: string) => SHIPMENT_STATUS_LABELS[s] ?? s;

export function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'delivered') return 'default';
  if (s === 'cancelled' || s === 'unavailable') return 'destructive';
  if (s === 'new') return 'secondary';
  return 'outline';
}

export const egp = (n: number | string | null | undefined) => formatEGP(Number(n ?? 0), 'ar');
export const dateAr = (d: string | null | undefined) => (d ? formatDate(d, 'ar') : '—');

// أسماء المنتجات في الشحنات متخزنة كده: 'English name|الاسم العربي'
export function itemName(raw: string): string {
  const [en, ar] = String(raw ?? '').split('|');
  return (ar || en || '').trim();
}

// رابط واتساب لرقم مصري (01xxxxxxxxx)
export function waLink(phone: string): string {
  let d = String(phone ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '20' + d.slice(1);
  return `https://wa.me/${d}`;
}

// أعمدة جدول shops المسموح بقراءتها (العمولة سرية وبتتقرا من دوال الأدمن بس)
export const SHOP_PUBLIC_COLUMNS =
  'id, name, slug, is_partner, delivery_fee, free_delivery_threshold, delivery_days_text, contact_whatsapp, external_url, logo_url, is_active';

// تنضيف كلمة البحث قبل ما تدخل في فلتر or()
export const cleanSearch = (s: string) => s.trim().replace(/[%,()*\\]/g, '');

export function errMsg(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
  return 'حصل خطأ غير متوقع';
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '\uFEFF' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
