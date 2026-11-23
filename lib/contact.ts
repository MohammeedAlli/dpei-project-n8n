'use client';

import * as React from 'react';
import { getSettings } from '@/data/api';

/** "0100 123 4567" / "+20 100…" / "00201…" → "20100…" (wa.me format). null when unusable. */
export function normalizeWhatsapp(raw?: string | null): string | null {
  let d = (raw ?? '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0') && d.length === 11) d = '2' + d.slice(1);
  return d.length >= 10 && d.length <= 15 ? d : null;
}

export const prettyPhone = (digits: string) => `+${digits}`;

export interface SupportContact {
  whatsapp: string | null; // digits, ready for https://wa.me/<digits>
  email: string | null;
  loaded: boolean;
}

/**
 * Support contact from `settings.support_whatsapp` (DB), falling back to
 * NEXT_PUBLIC_SUPPORT_WHATSAPP / NEXT_PUBLIC_SUPPORT_EMAIL. Never invents a number:
 * if nothing is configured, whatsapp is null and the UI hides the link.
 */
export function useSupportContact(): SupportContact {
  const [state, setState] = React.useState<SupportContact>({
    whatsapp: normalizeWhatsapp(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP),
    email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || null,
    loaded: false,
  });
  React.useEffect(() => {
    let live = true;
    getSettings()
      .then((s) => live && setState((cur) => ({ ...cur, whatsapp: normalizeWhatsapp(s.support_whatsapp) ?? cur.whatsapp, loaded: true })))
      .catch(() => live && setState((cur) => ({ ...cur, loaded: true })));
    return () => {
      live = false;
    };
  }, []);
  return state;
}
