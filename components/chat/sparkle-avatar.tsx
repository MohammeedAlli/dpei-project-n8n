'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SparkleAvatar({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = size === 'lg' ? 'h-12 w-12' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const i = size === 'lg' ? 'h-6 w-6' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <span className={cn('relative inline-flex shrink-0 items-center justify-center rounded-full bg-brand-gradient text-primary-foreground shadow-glow', s, className)}>
      <motion.span
        animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className="flex"
      >
        <Sparkles className={i} />
      </motion.span>
      <span className="absolute -end-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-400" />
    </span>
  );
}
