'use client';

import { motion } from 'framer-motion';

// Circuit traces on a 1200×720 canvas: orthogonal runs with 45° bends, like a real PCB.
const TRACES = [
  'M0 180 H260 L320 240 H620 L680 180 H1200',
  'M0 520 H180 L240 460 H520 L580 520 H900 L960 580 H1200',
  'M300 0 V90 L360 150 V330 L420 390 H700',
  'M900 0 V120 L840 180 V400 L900 460 V720',
  'M1200 330 H1040 L980 270 H780',
  'M120 720 V600 L180 540',
];
const NODES: Array<[number, number]> = [
  [260, 180], [620, 240], [180, 520], [520, 460], [700, 390], [840, 180], [900, 460], [780, 270], [180, 540],
];

/** Animated gradient mesh + circuit traces that draw themselves, then carry a moving "electron". */
export function HeroBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="hero-mesh">
        <i className="mesh-blob mesh-a" />
        <i className="mesh-blob mesh-b" />
        <i className="mesh-blob mesh-c" />
      </div>

      <svg
        className="absolute inset-0 h-full w-full text-accent"
        viewBox="0 0 1200 720"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {TRACES.map((d, i) => (
          <g key={i}>
            <motion.path
              d={d}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.28 }}
              transition={{ duration: 2.4, delay: 0.3 + i * 0.28, ease: 'easeInOut' }}
            />
            {/* travelling electron (CSS; hidden under reduced motion) */}
            <path
              d={d}
              pathLength={200}
              className="trace-flow"
              style={{ ['--flow-delay' as string]: `${3 + i * 1.1}s` }}
            />
          </g>
        ))}
        {NODES.map(([x, y], i) => (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={4}
            fill="currentColor"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.55, scale: 1 }}
            transition={{ delay: 1 + i * 0.2, type: 'spring', stiffness: 300, damping: 14 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        ))}
      </svg>
    </div>
  );
}
