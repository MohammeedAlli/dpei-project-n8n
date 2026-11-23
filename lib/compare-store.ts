'use client';

import * as React from 'react';

const KEY = 'souk-compare';
export const MAX_PINS = 3;
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
    /* ignore */
  }
  listeners.forEach((l) => l());
}

/** Up to 3 pinned products for the side-by-side drawer (persisted in localStorage). */
export function useCompare() {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);
  const list = mounted ? read() : [];
  return {
    ids: list,
    full: list.length >= MAX_PINS,
    has: (id: string) => list.includes(id),
    toggle: (id: string) => {
      const cur = read();
      if (cur.includes(id)) write(cur.filter((x) => x !== id));
      else if (cur.length < MAX_PINS) write([...cur, id]);
    },
    remove: (id: string) => write(read().filter((x) => x !== id)),
    clear: () => write([]),
  };
}
