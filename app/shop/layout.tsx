import { ShopMfaGuard } from '@/components/auth/shop-mfa-guard';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <ShopMfaGuard>{children}</ShopMfaGuard>;
}
