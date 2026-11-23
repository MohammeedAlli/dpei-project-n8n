'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Sparkles, X } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { ChatPanel } from '@/components/chat/chat-panel';
import { cn } from '@/lib/utils';

/**
 * Floating assistant. Placement rules so it never covers "Add to Cart":
 *  - lives on the inline-END side, lifted to bottom-24 on phones (above bottom bars / safe area)
 *  - slides out of the way while the user scrolls down on a phone, returns when scrolling stops
 *  - hidden entirely on phones on product detail / cart / checkout pages, where Add to Cart & Checkout are primary
 *  - hidden on /assistant (already there) and on the admin and shop dashboards
 */
export function FloatingChat() {
  const { lang } = useLanguage();
  const pathname = usePathname() || '/';
  const [open, setOpen] = React.useState(false);
  const [tip, setTip] = React.useState(false);
  const [away, setAway] = React.useState(false);
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  // hide-while-scrolling (phones only; CSS keeps it visible on sm+)
  React.useEffect(() => {
    let last = window.scrollY;
    let t: ReturnType<typeof setTimeout>;
    const on = () => {
      const y = window.scrollY;
      if (y > last + 6) setAway(true);
      if (y < last - 6) setAway(false);
      last = y;
      clearTimeout(t);
      t = setTimeout(() => setAway(false), 900);
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => {
      window.removeEventListener('scroll', on);
      clearTimeout(t);
    };
  }, []);

  React.useEffect(() => setOpen(false), [pathname]);
  React.useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);

  // first-visit tooltip nudge, once per session
  React.useEffect(() => {
    try {
      if (sessionStorage.getItem('souk-chat-tip')) return;
      const a = setTimeout(() => setTip(true), 2500);
      const b = setTimeout(() => {
        setTip(false);
        sessionStorage.setItem('souk-chat-tip', '1');
      }, 7500);
      return () => {
        clearTimeout(a);
        clearTimeout(b);
      };
    } catch {
      /* ignore */
    }
  }, []);

  if (pathname.startsWith('/assistant') || /^\/(admin|shop)(\/|$)/.test(pathname)) return null;
  const hideOnPhone = /^\/(products\/[^/]+|cart|checkout)/.test(pathname);

  return (
    <div className={cn('fixed end-4 z-popover bottom-[calc(6rem+env(safe-area-inset-bottom))] sm:end-6 sm:bottom-6', hideOnPhone && 'max-sm:hidden')}>
      <AnimatePresence>
        {open && (
          <motion.div
            key="popup"
            role="dialog"
            aria-label={L('المساعد الذكي', 'AI Assistant')}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            style={{ transformOrigin: lang === 'ar' ? 'bottom left' : 'bottom right' }}
            className="fixed inset-x-3 bottom-3 top-16 z-modal flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-3 sm:absolute sm:inset-x-auto sm:bottom-16 sm:top-auto sm:end-0 sm:h-[32rem] sm:max-h-[calc(100dvh-7rem)] sm:w-[24rem]"
          >
            <button type="button" onClick={() => setOpen(false)} aria-label={L('إغلاق', 'Close')} className="absolute end-2 top-2.5 z-10 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X className="h-4 w-4" />
            </button>
            <Link href="/assistant" aria-label={L('افتح في صفحة كاملة', 'Open full page')} className="absolute end-10 top-2.5 z-10 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Maximize2 className="h-4 w-4" />
            </Link>
            <ChatPanel compact className="h-full [&>div:first-child]:pe-20" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn('relative transition-all duration-base max-sm:data-[away=true]:pointer-events-none max-sm:data-[away=true]:translate-y-24 max-sm:data-[away=true]:opacity-0', open && 'max-sm:hidden')} data-away={away}>
        <AnimatePresence>
          {tip && !open && (
            <motion.div
              initial={{ opacity: 0, x: lang === 'ar' ? -8 : 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              role="tooltip"
              className="glass pointer-events-none absolute bottom-2 end-16 hidden whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium shadow-2 sm:block"
            >
              {L('اسأل المساعد الذكي', 'Ask the AI Assistant')}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          onMouseEnter={() => !open && setTip(true)}
          onMouseLeave={() => setTip(false)}
          onFocus={() => !open && setTip(true)}
          onBlur={() => setTip(false)}
          aria-expanded={open}
          aria-label={L('اسأل المساعد الذكي', 'Ask the AI Assistant')}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-primary-foreground shadow-glow-md transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {!open && <span aria-hidden className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/50" />}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={open ? 'x' : 's'} initial={{ rotate: -60, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 60, opacity: 0 }} transition={{ duration: 0.15 }} className="relative flex">
              {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}
