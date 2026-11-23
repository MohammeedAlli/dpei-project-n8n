'use client';

import { motion } from 'framer-motion';

/** Package + truck illustration; wheels spin and the road dashes drift (transform-only). */
export function TrackArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 120" className={className} aria-hidden fill="none">
      <ellipse cx="120" cy="108" rx="100" ry="6" className="fill-foreground/10" />
      <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
        {/* package */}
        <path d="M34 52l24-12 24 12v28L58 92 34 80z" className="fill-accent/20 stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M34 52l24 12 24-12M58 64v28" className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M46 46l24 12" className="stroke-accent" strokeWidth="3" strokeLinecap="round" />
        {/* truck */}
        <rect x="104" y="44" width="62" height="40" rx="5" className="fill-card stroke-foreground" strokeWidth="2.5" />
        <path d="M166 56h22l14 16v12h-36z" className="fill-accent/20 stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M174 62h12l8 10h-20z" className="fill-background stroke-foreground" strokeWidth="2" strokeLinejoin="round" />
        <path d="M114 56h30M114 66h18" className="stroke-accent" strokeWidth="3" strokeLinecap="round" />
        {[128, 186].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="88" r="9" className="fill-foreground" />
            <motion.g style={{ originX: `${cx}px`, originY: '88px' }} animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
              <circle cx={cx} cy="88" r="3.5" className="fill-background" />
              <path d={`M${cx} 82v12`} className="stroke-foreground" strokeWidth="1.5" />
            </motion.g>
          </g>
        ))}
      </motion.g>
      <motion.path
        d="M14 108h30M200 108h26"
        className="stroke-accent"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="8 10"
        animate={{ strokeDashoffset: [0, -36] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
      />
    </svg>
  );
}
