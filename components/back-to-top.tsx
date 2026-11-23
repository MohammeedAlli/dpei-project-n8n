'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';

/** Appears after scrolling; sits on the inline-START side so it never collides with the chat button (inline-end). */
export function BackToTop() {
  const { lang } = useLanguage();
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    const on = () => setShow(window.scrollY > 700);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
          aria-label={lang === 'ar' ? 'رجوع لفوق' : 'Back to top'}
          className="glass fixed bottom-[max(1rem,env(safe-area-inset-bottom))] start-3 z-toast flex h-11 w-11 items-center justify-center rounded-full text-foreground shadow-3 hover:shadow-glow sm:start-6 sm:bottom-6"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
