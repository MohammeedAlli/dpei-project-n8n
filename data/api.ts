import { supabase } from '@/lib/supabase';
import type {
  Category,
  Shop,
  Offer,
  OfferWithShop,
  ProductWithMeta,
  Settings,
  CreateOrderInput,
  OrderRecord,
} from './types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function logError(where: string, error: { message: string } | null) {
  if (error) console.error(`[api] ${where}:`, error.message);
}

// ───────────── الأقسام ─────────────
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name_en, name_ar, icon, sort_order')
    .order('sort_order', { ascending: true })
    .order('name_en', { ascending: true });
  logError('getCategories', error);
  return (data ?? []) as Category[];
}

// ───────────── المحلات ─────────────
export async function getActiveShops(): Promise<Shop[]> {
  const { data, error } = await supabase
    .from('shops')
    .select(
      'id, name, slug, is_partner, delivery_fee, free_delivery_threshold, delivery_days_text, contact_whatsapp, external_url, logo_url, is_active'
    )
    .eq('is_active', true)
    .order('name', { ascending: true });
  logError('getActiveShops', error);
  // نسبة العمولة سرية ومش بتتبعت للمتصفح
  return (data ?? []).map((s: Record<string, unknown>) => ({
    ...s,
    commission_rate: 0,
  })) as unknown as Shop[];
}

// ───────────── المنتجات ─────────────
export async function getProducts(opts?: {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  partnerOnly?: boolean;
  sort?: 'lowest' | 'highest' | 'newest' | 'relevance';
  limit?: number;
  page?: number;
}): Promise<ProductWithMeta[]> {
  let query = supabase.from('products_with_meta').select('*');

  // بحث: كل كلمة لازم تظهر في الاسم (عربي/إنجليزي) أو الـ SKU أو الماركة
  if (opts?.search) {
    const words = opts.search
      .split(/\s+/)
      .map((w) => w.replace(/[,()%*\\]/g, ''))
      .filter(Boolean);
    for (const w of words) {
      query = query.or(
        `name_en.ilike.%${w}%,name_ar.ilike.%${w}%,sku.ilike.%${w}%,brand.ilike.%${w}%`
      );
    }
  }

  // القسم: يقبل id أو slug
  if (opts?.category && opts.category !== 'all') {
    let categoryId: string | null = null;
    if (UUID_RE.test(opts.category)) {
      categoryId = opts.category;
    } else {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', opts.category)
        .maybeSingle();
      categoryId = cat?.id ?? null;
    }
    if (!categoryId) return [];
    query = query.eq('category_id', categoryId);
  }

  if (opts?.brand && opts.brand !== 'all') {
    query = query.eq('brand', opts.brand);
  }

  const { data, error } = await query;
  logError('getProducts', error);
  let result = (data ?? []) as ProductWithMeta[];

  // فلتر "متاح فقط" / "محلات شريكة فقط": نحسب الأسعار من العروض المطابقة بس
  if (opts?.inStockOnly || opts?.partnerOnly) {
    const { data: rows, error: offersError } = await supabase
      .from('offers')
      .select('product_id, price, in_stock, shop:shops!inner(is_active, is_partner)');
    logError('getProducts/offers', offersError);
    const stats = new Map<string, { min: number; count: number }>();
    for (const row of (rows ?? []) as unknown as Array<{
      product_id: string;
      price: number;
      in_stock: boolean;
      shop: { is_active: boolean; is_partner: boolean };
    }>) {
      if (!row.shop?.is_active) continue;
      if (opts.inStockOnly && !row.in_stock) continue;
      if (opts.partnerOnly && !row.shop.is_partner) continue;
      const s = stats.get(row.product_id);
      if (s) {
        s.min = Math.min(s.min, row.price);
        s.count += 1;
      } else {
        stats.set(row.product_id, { min: row.price, count: 1 });
      }
    }
    result = result
      .filter((p) => stats.has(p.id))
      .map((p) => ({
        ...p,
        lowest_price: stats.get(p.id)!.min,
        offers_count: stats.get(p.id)!.count,
      }));
  }

  if (typeof opts?.minPrice === 'number') {
    result = result.filter((p) => (p.lowest_price ?? Infinity) >= opts.minPrice!);
  }
  if (typeof opts?.maxPrice === 'number') {
    result = result.filter((p) => (p.lowest_price ?? 0) <= opts.maxPrice!);
  }

  if (opts?.sort === 'lowest') {
    result.sort((a, b) => (a.lowest_price ?? Infinity) - (b.lowest_price ?? Infinity));
  } else if (opts?.sort === 'highest') {
    result.sort((a, b) => (b.lowest_price ?? 0) - (a.lowest_price ?? 0));
  } else if (opts?.sort === 'newest') {
    result.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  } else {
    result.sort((a, b) => a.name_en.localeCompare(b.name_en));
  }

  if (opts?.limit) {
    const page = Math.max(1, opts.page ?? 1);
    const start = (page - 1) * opts.limit;
    result = result.slice(start, start + opts.limit);
  }

  return result;
}

export async function getProduct(id: string): Promise<ProductWithMeta | null> {
  if (!UUID_RE.test(id)) return null;
  const { data, error } = await supabase
    .from('products_with_meta')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  logError('getProduct', error);
  return (data as ProductWithMeta | null) ?? null;
}

// ───────────── العروض (أسعار نفس المنتج في المحلات) ─────────────
export async function getProductOffers(productId: string): Promise<OfferWithShop[]> {
  if (!UUID_RE.test(productId)) return [];
  const { data, error } = await supabase
    .from('offers')
    .select(
      `id, product_id, shop_id, price, in_stock, external_product_url,
       last_updated_at, created_at, updated_at,
       shop:shops!inner(id, name, slug, is_active, is_partner, delivery_fee,
         free_delivery_threshold, delivery_days_text, external_url, contact_whatsapp)`
    )
    .eq('product_id', productId)
    .order('price', { ascending: true });
  logError('getProductOffers', error);

  type Row = Offer & { shop: OfferWithShop['shop'] & { is_active: boolean } };
  return ((data ?? []) as unknown as Row[])
    .filter((o) => o.shop?.is_active)
    .map(({ shop, ...offer }) => {
      const { is_active: _ignored, ...shopFields } = shop;
      return { ...offer, shop: shopFields };
    });
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4
): Promise<ProductWithMeta[]> {
  if (!categoryId) return [];
  const { data, error } = await supabase
    .from('products_with_meta')
    .select('*')
    .eq('category_id', categoryId)
    .neq('id', productId)
    .limit(limit);
  logError('getRelatedProducts', error);
  return (data ?? []) as ProductWithMeta[];
}

export async function getBrands(): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('brand')
    .not('brand', 'is', null);
  logError('getBrands', error);
  const brands = new Set<string>();
  for (const row of data ?? []) if (row.brand) brands.add(row.brand);
  return Array.from(brands).sort();
}

// ───────────── الإعدادات ─────────────
export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('support_whatsapp, site_name_ar, site_name_en')
    .eq('id', 1)
    .maybeSingle();
  logError('getSettings', error);
  return (
    (data as Settings | null) ?? { support_whatsapp: '', site_name_ar: '', site_name_en: '' }
  );
}

// ───────────── الطلبات ─────────────
export async function createOrder(input: CreateOrderInput): Promise<{
  code: string;
  grand_total: number;
  shipments_count: number;
}> {
  const { data, error } = await supabase.rpc('create_order', {
    p_customer_name: input.customer_name,
    p_phone: input.phone,
    p_governorate: input.governorate,
    p_address: input.address,
    p_notes: input.notes ?? null,
    p_items: input.items.map((i) => ({ offer_id: i.offer_id, quantity: i.quantity })),
  });
  if (error) throw new Error(error.message);
  return data as { code: string; grand_total: number; shipments_count: number };
}

export async function getOrderByCodeAndPhone(
  code: string,
  phone: string
): Promise<OrderRecord | null> {
  const { data, error } = await supabase.rpc('get_order', {
    p_code: code,
    p_phone: phone,
  });
  logError('getOrderByCodeAndPhone', error);
  return (data as OrderRecord | null) ?? null;
}
