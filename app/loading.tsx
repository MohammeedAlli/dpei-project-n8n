'use client';

import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';

/** Branded route loading screen: chip with a pulsing ring and circuit traces drawing themselves. */
export default function Loading() {
  const { lang } = useLanguage();
  return (
    <div role="status" aria-live="polite" className="bg-pcb flex min-h-[70dvh] flex-col items-center justify-center gap-6">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/40" />
        <span className="absolute inset-3 animate-pulse-ring rounded-full bg-electric/30 [animation-delay:.6s]" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-md bg-brand-gradient text-primary-foreground shadow-glow-md">
          <Cpu className="h-8 w-8" />
        </span>
      </div>
      <svg viewBox="0 0 200 12" className="h-3 w-48 text-accent" aria-hidden fill="none">
        <motion.path
          d="M0 6 H60 L70 2 H130 L140 10 H200"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
        />
      </svg>
      <p className="text-sm font-medium text-muted-foreground">{lang === 'ar' ? 'جاري التحميل…' : 'Loading…'}</p>
    </div>
  );
}
