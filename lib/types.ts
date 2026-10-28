// Re-export from the mock data layer types.
// When real backend is connected, only this file needs to change.
export type {
  Language,
  Category,
  Shop,
  Product,
  Offer,
  OfferWithShop,
  CartItem,
  ShipmentStatus,
} from '@/data/types';

export { SHIPMENT_STATUSES } from '@/data/types';
