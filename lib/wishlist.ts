'use client';

import * as React from 'react';

const KEY = 'souk-wishlist';
const listeners = new Set<() => void>();
let ids: string[] | null = null;

function read(): string[] {
  if (ids) return ids;
  try {
    ids = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
  } catch {
    ids = [];
  }
  return ids!;
}
function write(next: string[]) {
  ids = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  listeners.forEach((l) => l());
}

export function useWishlist(productId: string) {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);
  const liked = mounted && read().includes(productId);
  const toggle = React.useCallback(() => {
    const cur = read();
    write(cur.includes(productId) ? cur.filter((x) => x !== productId) : [...cur, productId]);
  }, [productId]);
  return { liked, toggle };
}
