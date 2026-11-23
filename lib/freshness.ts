export type FreshLevel = 'fresh' | 'aging' | 'stale';

export interface Freshness {
  level: FreshLevel;
  days: number;
  label: string;
  /** AA-contrast text colour classes for light + dark */
  text: string;
  dot: string;
  ring: string;
}

const TONE: Record<FreshLevel, Pick<Freshness, 'text' | 'dot' | 'ring'>> = {
  fresh: { text: 'text-emerald-800 dark:text-emerald-400', dot: 'bg-emerald-500', ring: 'border-emerald-500/30 bg-emerald-500/10' },
  aging: { text: 'text-amber-800 dark:text-amber-400', dot: 'bg-amber-500', ring: 'border-amber-500/35 bg-amber-500/10' },
  stale: { text: 'text-red-800 dark:text-red-400', dot: 'bg-red-500', ring: 'border-red-500/35 bg-red-500/10' },
};

/** green < 7 days · amber 7–13 · red 14+ */
export function getFreshness(date: string, lang: 'ar' | 'en'): Freshness {
  const ms = Date.now() - new Date(date).getTime();
  const days = Math.max(0, Math.floor(ms / 86_400_000));
  const level: FreshLevel = days >= 14 ? 'stale' : days >= 7 ? 'aging' : 'fresh';
  const ar = lang === 'ar';
  let when: string;
  if (days === 0) when = ar ? 'اتحدّث النهارده' : 'Updated today';
  else if (days === 1) when = ar ? 'اتحدّث امبارح' : 'Updated yesterday';
  else when = ar ? `اتحدّث من ${days} يوم` : `Updated ${days} days ago`;
  const note =
    level === 'fresh' ? '' : level === 'aging' ? (ar ? ' · أكّد السعر مع المحل' : ' · confirm with shop') : ar ? ' · السعر قديم' : ' · price may be outdated';
  return { level, days, label: when + note, ...TONE[level] };
}
