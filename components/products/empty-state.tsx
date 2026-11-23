'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { RotateCcw, Sparkles } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';

export function EmptyState({ onClear, hasFilters }: { onClear: () => void; hasFilters: boolean }) {
  const { lang } = useLanguage();
  return (
    <div className="bg-pcb flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-14 text-center">
      <motion.svg
        viewBox="0 0 160 120"
        className="mb-5 h-32 w-44 text-foreground/70"
        aria-hidden
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* chip */}
        <rect x="30" y="34" width="56" height="52" rx="6" className="fill-accent/15 stroke-current" strokeWidth="2.2" />
        <path d="M42 34v-10M58 34v-10M74 34v-10M42 86v10M58 86v10M74 86v10M30 48h-10M30 64h-10M30 80h-10M86 48h10M86 80h10" className="stroke-current" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M46 52h24M46 62h16" className="stroke-accent" strokeWidth="2.4" strokeLinecap="round" />
        {/* magnifier */}
        <motion.g animate={{ x: [0, 5, 0], y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}>
          <circle cx="102" cy="66" r="22" className="fill-background/70 stroke-accent" strokeWidth="3" />
          <path d="M118 82l18 18" className="stroke-accent" strokeWidth="5" strokeLinecap="round" />
          <path d="M92 60a12 12 0 0 1 10-8" className="stroke-current" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </motion.g>
      </motion.svg>

      <h3 className="font-display text-xl font-bold">
        {lang === 'ar' ? 'مالقيناش مكونات مطابقة' : 'No components found'}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {lang === 'ar'
          ? 'جرّب كلمات تانية أو خفّف الفلاتر، أو اسأل المساعد الذكي وهو يلاقيلك البديل.'
          : 'Try different keywords or loosen the filters — or ask the AI Assistant to find an alternative.'}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {hasFilters && (
          <Button variant="outline" onClick={onClear}>
            <RotateCcw className="h-4 w-4" />
            {lang === 'ar' ? 'مسح الفلاتر' : 'Clear filters'}
          </Button>
        )}
        <Button asChild className="btn-shine">
          <Link href="/assistant">
            <Sparkles className="h-4 w-4" />
            {lang === 'ar' ? 'اسأل المساعد الذكي' : 'Ask the AI Assistant'}
          </Link>
        </Button>
      </div>
    </div>
  );
}
