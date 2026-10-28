// Re-export from the mock data layer so all existing imports keep working.
// When real backend is connected, only this file needs to change.
export {
  getCategories,
  getActiveShops,
  getProducts,
  getProduct,
  getProductOffers,
  getRelatedProducts,
  getBrands,
} from '@/data/api';

export type { ProductWithMeta } from '@/data/types';
