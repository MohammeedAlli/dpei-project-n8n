'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Accessible switch (role="switch"). Thumb slides along the inline axis → RTL-safe. */
export function ToggleSwitch({
  checked,
  onCheckedChange,
  label,
  hint,
  className,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-sm px-1 py-2 text-start',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors duration-base',
          checked ? 'justify-end border-accent bg-accent shadow-glow' : 'justify-start border-input bg-muted'
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 32 }}
          className="h-[18px] w-[18px] rounded-full bg-white shadow-1"
        />
      </span>
    </button>
  );
}
