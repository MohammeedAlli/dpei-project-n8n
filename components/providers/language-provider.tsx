'use client';

import * as React from 'react';
import type { Language } from '@/lib/types';

type LanguageContextValue = {
  lang: Language;
  dir: 'rtl' | 'ltr';
  setLang: (lang: Language) => void;
  toggle: () => void;
  ready: boolean;
};

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'souk-lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Language>('ar');
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
      if (stored === 'ar' || stored === 'en') {
        setLangState(stored);
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const dir: 'rtl' | 'ltr' = lang === 'ar' ? 'rtl' : 'ltr';

  React.useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang, dir, ready]);

  const setLang = React.useCallback((next: Language) => setLangState(next), []);
  const toggle = React.useCallback(
    () => setLangState((prev) => (prev === 'ar' ? 'en' : 'ar')),
    []
  );

  const value = React.useMemo(
    () => ({ lang, dir, setLang, toggle, ready }),
    [lang, dir, setLang, toggle, ready]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
