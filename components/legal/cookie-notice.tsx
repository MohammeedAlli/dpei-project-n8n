'use client';

import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';

const KEY = 'souk-notice-v1';

/**
 * Information notice, not a consent wall: the site only uses strictly necessary storage (no analytics, no ads),
 * which does not need consent. If you ever add analytics or ads, replace this with real accept / reject choices.
 */
export function CookieNotice() {
  const { lang } = useLanguage();
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);
  const close = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
  };
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="region"
          aria-label={L('إشعار الخصوصية', 'Privacy notice')}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="glass fixed inset-x-3 bottom-3 z-toast flex flex-col gap-3 rounded-lg p-4 shadow-3 sm:inset-x-auto sm:bottom-6 sm:start-6 sm:max-w-md"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <p className="text-sm leading-relaxed">
              {L('الموقع بيستخدم تخزين ضروري بس (السلة واللغة والمفضلة) ومفيش تتبع إعلاني. ', 'This site uses only essential storage (cart, language, wishlist) and no advertising tracking. ')}
              <Link href="/privacy" className="text-accent underline-offset-4 hover:underline">
                {L('سياسة الخصوصية', 'Privacy Policy')}
              </Link>
            </p>
          </div>
          <Button size="sm" onClick={close} className="self-end">
            {L('تمام', 'Got it')}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
