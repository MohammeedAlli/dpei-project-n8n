'use client';

import { MotionConfig } from 'framer-motion';

/** One switch for the whole site: transform/layout animations are skipped for users who prefer reduced motion. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
