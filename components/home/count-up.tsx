'use client';

import * as React from 'react';
import { useReducedMotion } from 'framer-motion';

/** Eased count from `from` → `target`. Jumps straight to target under reduced motion. */
export function useCountUp(
  target: number,
  { duration = 1.4, active = true, from = 0 }: { duration?: number; active?: boolean; from?: number } = {}
) {
  const reduce = useReducedMotion();
  const [value, setValue] = React.useState(from);

  React.useEffect(() => {
    if (!active) return;
    if (reduce) {
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const ms = duration * 1000;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration, from, reduce]);

  return value;
}

export function CountUp({
  value,
  active = true,
  duration,
  from,
  suffix = '',
  format,
  className,
}: {
  value: number;
  active?: boolean;
  duration?: number;
  from?: number;
  suffix?: string;
  format?: (n: number) => string;
  className?: string;
}) {
  const v = useCountUp(value, { active, duration, from });
  const text = format ? format(v) : Math.round(v).toLocaleString('en-US');
  return (
    <span className={className}>
      {text}
      {suffix}
    </span>
  );
}
