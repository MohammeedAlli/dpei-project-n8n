import type { Language } from './types';

export const formatEGP = (amount: number, lang: Language): string => {
  const value = Number(amount || 0);
  const formatted = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return lang === 'ar' ? `${formatted} ج.م` : `EGP ${formatted}`;
};

export const formatDate = (date: string | Date, lang: Language): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
};

export const formatRelative = (date: string | Date, lang: Language): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar-EG' : 'en', { numeric: 'auto' });
  if (seconds < 60) return rtf.format(-Math.max(1, seconds), 'second');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  const days = Math.floor(hours / 24);
  if (days < 30) return rtf.format(-days, 'day');
  const months = Math.floor(days / 30);
  return rtf.format(-months, 'month');
};

export const isStale = (date: string | Date, thresholdMinutes = 30): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return Date.now() - d.getTime() > thresholdMinutes * 60 * 1000;
};
