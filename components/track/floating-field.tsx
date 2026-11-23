'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string | null;
  valid?: boolean;
  icon?: React.ReactNode;
};

/** Floating-label input: label sits inside, floats up on focus/value (pure CSS via peer + placeholder-shown). */
export const FloatingField = React.forwardRef<HTMLInputElement, Props>(function FloatingField(
  { label, hint, error, valid, icon, id, className, ...rest },
  ref
) {
  const auto = React.useId();
  const fid = id ?? auto;
  const hid = `${fid}-hint`;
  return (
    <div>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}
        <input
          ref={ref}
          id={fid}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={hid}
          className={cn(
            'field peer h-14 w-full pb-1 pt-5',
            icon ? 'ps-11' : 'ps-4',
            'pe-10',
            className
          )}
          {...rest}
        />
        <label
          htmlFor={fid}
          className={cn(
            'pointer-events-none absolute top-1/2 origin-[0] -translate-y-1/2 text-sm text-muted-foreground transition-all duration-fast',
            icon ? 'start-11' : 'start-4',
            'peer-focus:top-3.5 peer-focus:text-[11px] peer-focus:text-accent',
            'peer-[:not(:placeholder-shown)]:top-3.5 peer-[:not(:placeholder-shown)]:text-[11px]',
            error && 'peer-focus:text-destructive'
          )}
        >
          {label}
        </label>
        {valid && !error && (
          <span className="absolute end-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-white" aria-hidden>
            <Check className="h-3 w-3" />
          </span>
        )}
      </div>
      <p id={hid} role={error ? 'alert' : undefined} className={cn('mt-1.5 min-h-[1.1rem] px-1 text-xs', error ? 'text-destructive' : 'text-muted-foreground')} dir="auto">
        {error || hint}
      </p>
    </div>
  );
});
