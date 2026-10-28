export type Language = 'ar' | 'en';

export type Category = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  icon: string | null;
  sort_order: number;
};

export type Shop = {
  id: string;
  name: string;
  slug: string;
  is_partner: boolean;
  commission_rate: number;
  delivery_fee: number;
  free_delivery_threshold: number;
  delivery_days_text: string | null;
  contact_whatsapp: string | null;
  external_url: string | null;
  logo_url: string | null;
  is_active: boolean;
};

export type Product = {
  id: string;
  name_en: string;
  name_ar: string;
  sku: string | null;
  brand: string | null;
  category_id: string | null;
  description_en: string | null;
  description_ar: string | null;
  image_url: string | null;
  specs: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export type Offer = {
  id: string;
  product_id: string;
  shop_id: string;
  price: number;
  in_stock: boolean;
  external_product_url: string | null;
  last_updated_at: string;
  created_at: string;
  updated_at: string;
};

export type OfferWithShop = Offer & {
  shop: Pick<
    Shop,
    'id' | 'name' | 'slug' | 'is_partner' | 'delivery_fee' | 'free_delivery_threshold' | 'delivery_days_text' | 'external_url' | 'contact_whatsapp'
  >;
};

export type CartItem = {
  offer_id: string;
  product_id: string;
  shop_id: string;
  shop_name: string;
  product_name_en: string;
  product_name_ar: string;
  unit_price: number;
  in_stock: boolean;
  quantity: number;
  image_url: string | null;
};

export const SHIPMENT_STATUSES = [
  'new',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'unavailable',
  'price_changed',
  'awaiting_approval',
  'cancelled',
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export type ProductWithMeta = Product & {
  category: Pick<Category, 'id' | 'slug' | 'name_en' | 'name_ar'> | null;
  lowest_price: number | null;
  offers_count: number;
};

export type Settings = {
  support_whatsapp: string;
  site_name_ar: string;
  site_name_en: string;
};

export type CreateOrderInput = {
  customer_name: string;
  phone: string;
  governorate: string;
  address: string;
  notes?: string | null;
  items: Array<{ offer_id: string; quantity: number }>;
};

export type ShipmentRecord = {
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

export type OrderRecord = {
  code: string;
  customer_name: string;
  phone: string;
  governorate: string;
  address: string;
  notes: string | null;
  items_total: number;
  delivery_total: number;
  grand_total: number;
  status: string;
  payment_method: string;
  created_at: string;
  shipments: ShipmentRecord[];
};
