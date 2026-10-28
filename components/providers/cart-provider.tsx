'use client';

import * as React from 'react';
import type { CartItem } from '@/lib/types';

type CartContextValue = {
  items: CartItem[];
  count: number;
  add: (item: CartItem) => void;
  remove: (offerId: string) => void;
  setQty: (offerId: string, qty: number) => void;
  clear: () => void;
  ready: boolean;
};

const CartContext = React.createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'souk-cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored) as CartItem[]);
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, ready]);

  const add = React.useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.offer_id === item.offer_id);
      if (existing) {
        return prev.map((p) =>
          p.offer_id === item.offer_id
            ? { ...p, quantity: Math.min(50, p.quantity + item.quantity) }
            : p
        );
      }
      return [...prev, item];
    });
  }, []);

  const remove = React.useCallback((offerId: string) => {
    setItems((prev) => prev.filter((p) => p.offer_id !== offerId));
  }, []);

  const setQty = React.useCallback((offerId: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((p) =>
          p.offer_id === offerId ? { ...p, quantity: Math.max(1, Math.min(50, qty)) } : p
        )
        .filter((p) => p.quantity > 0)
    );
  }, []);

  const clear = React.useCallback(() => setItems([]), []);

  const count = React.useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value = React.useMemo(
    () => ({ items, count, add, remove, setQty, clear, ready }),
    [items, count, add, remove, setQty, clear, ready]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
