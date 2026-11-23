'use client';

import * as React from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { Cpu } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { CountUp } from '@/components/home/count-up';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { ProductWithMeta } from '@/lib/catalog';

/* ------------------------------------------------------------------ art */

function ArduinoArt({ className }: { className?: string }) {
  const pins = Array.from({ length: 14 });
  return (
    <svg viewBox="0 0 240 160" className={className} aria-hidden>
      <defs>
        <linearGradient id="ard-pcb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="ard-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
        <filter id="ard-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="12" stdDeviation="9" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>
      <g filter="url(#ard-shadow)">
        <rect x="10" y="14" width="222" height="132" rx="10" fill="url(#ard-pcb)" />
        <rect x="10.5" y="14.5" width="221" height="131" rx="9.5" fill="none" stroke="#fff" strokeOpacity=".3" />
        {/* USB-B */}
        <rect x="0" y="36" width="56" height="44" rx="3" fill="url(#ard-metal)" />
        <rect x="8" y="44" width="40" height="28" rx="2" fill="#64748b" />
        {/* DC jack */}
        <rect x="0" y="100" width="46" height="36" rx="3" fill="#111827" />
        <rect x="6" y="108" width="24" height="20" rx="2" fill="#1f2937" />
        {/* MCU */}
        <rect x="112" y="62" width="86" height="30" rx="2" fill="#0b1220" />
        {pins.map((_, i) => (
          <React.Fragment key={i}>
            <rect x={115 + i * 5.7} y="58" width="2.4" height="4" fill="#cbd5e1" />
            <rect x={115 + i * 5.7} y="92" width="2.4" height="4" fill="#cbd5e1" />
          </React.Fragment>
        ))}
        {/* headers */}
        <rect x="66" y="20" width="148" height="10" rx="1.5" fill="#0b1220" />
        <rect x="66" y="130" width="148" height="10" rx="1.5" fill="#0b1220" />
        {Array.from({ length: 18 }).map((_, i) => (
          <React.Fragment key={i}>
            <rect x={69 + i * 8.1} y="23.5" width="3" height="3" fill="#fbbf24" />
            <rect x={69 + i * 8.1} y="133.5" width="3" height="3" fill="#fbbf24" />
          </React.Fragment>
        ))}
        {/* reset + LEDs */}
        <circle cx="80" cy="64" r="8" fill="#ef4444" stroke="#fecaca" strokeWidth="1.5" />
        <rect x="208" y="58" width="8" height="4" rx="1" fill="#fbbf24" />
        <rect x="208" y="68" width="8" height="4" rx="1" fill="#34d399" />
        <text x="122" y="118" fontFamily="ui-monospace, monospace" fontWeight="700" fontSize="17" fill="#fff" fillOpacity=".9">
          UNO
        </text>
        <text x="122" y="128" fontFamily="ui-monospace, monospace" fontSize="6" fill="#fff" fillOpacity=".6" letterSpacing="2">
          ARDUINO
        </text>
      </g>
    </svg>
  );
}

function ResistorArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 60" className={className} aria-hidden>
      <defs>
        <linearGradient id="res-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e2b6" />
          <stop offset="0.55" stopColor="#d9ae66" />
          <stop offset="1" stopColor="#a87832" />
        </linearGradient>
        <linearGradient id="res-lead" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
        <filter id="res-shadow" x="-10%" y="-40%" width="120%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000" floodOpacity="0.45" />
        </filter>
      </defs>
      <g filter="url(#res-shadow)">
        <rect x="0" y="27" width="200" height="4.5" rx="2" fill="url(#res-lead)" />
        <rect x="40" y="8" width="120" height="42" rx="20" fill="url(#res-body)" />
        <rect x="64" y="8" width="8" height="42" fill="#7c2d12" />
        <rect x="82" y="8" width="8" height="42" fill="#111827" />
        <rect x="100" y="8" width="8" height="42" fill="#dc2626" />
        <rect x="132" y="8" width="8" height="42" fill="#eab308" />
        <rect x="50" y="12" width="100" height="8" rx="4" fill="#fff" fillOpacity=".28" />
      </g>
    </svg>
  );
}

function SensorArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 130" className={className} aria-hidden>
      <defs>
        <linearGradient id="sen-pcb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="sen-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8fafc" />
          <stop offset="1" stopColor="#64748b" />
        </linearGradient>
        <filter id="sen-shadow" x="-20%" y="-20%" width="140%" height="170%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>
      <g filter="url(#sen-shadow)">
        <rect x="4" y="6" width="192" height="94" rx="8" fill="url(#sen-pcb)" />
        {[56, 144].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="53" r="34" fill="url(#sen-metal)" />
            <circle cx={cx} cy="53" r="27" fill="#0f172a" />
            <circle cx={cx} cy="53" r="19" fill="none" stroke="#475569" strokeWidth="1.5" />
            <circle cx={cx} cy="53" r="11" fill="none" stroke="#475569" strokeWidth="1.5" />
            <circle cx={cx} cy="53" r="4" fill="#64748b" />
          </g>
        ))}
        <rect x="88" y="42" width="24" height="12" rx="2" fill="#cbd5e1" />
        <text x="100" y="94" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="8" fill="#fff" fillOpacity=".75">
          HC-SR04
        </text>
        {[72, 90, 108, 126].map((x) => (
          <rect key={x} x={x} y="100" width="6" height="22" rx="1" fill="#fbbf24" />
        ))}
      </g>
    </svg>
  );
}

function LedArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 140" className={className} aria-hidden>
      <defs>
        <radialGradient id="led-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fb7185" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fb7185" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="led-dome" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#be123c" />
          <stop offset="0.45" stopColor="#fb7185" />
          <stop offset="1" stopColor="#9f1239" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="40" fill="url(#led-glow)" className="origin-center animate-pulse-dot" />
      <rect x="27" y="68" width="3" height="68" rx="1.5" fill="#cbd5e1" />
      <rect x="50" y="68" width="3" height="56" rx="1.5" fill="#cbd5e1" />
      <path d="M20 66 V38 a20 20 0 0 1 40 0 V66 z" fill="url(#led-dome)" />
      <rect x="15" y="64" width="50" height="8" rx="2" fill="#9f1239" />
      <ellipse cx="32" cy="30" rx="4" ry="9" fill="#fff" fillOpacity=".55" />
    </svg>
  );
}

/* ------------------------------------------------------------- parallax */

function Layer({
  sx,
  sy,
  depth,
  className,
  children,
}: {
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  depth: number;
  className?: string;
  children: React.ReactNode;
}) {
  const x = useTransform(sx, [-0.5, 0.5], [-depth, depth]);
  const y = useTransform(sy, [-0.5, 0.5], [-depth, depth]);
  return (
    <motion.div style={{ x, y }} className={cn('absolute', className)}>
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------- price cards */

/** Rotates through real products. 3 slots, each swaps on a staggered tick. */
function usePriceSlots(items: ProductWithMeta[], slotCount: number) {
  const n = items.length;
  const slots = Math.min(slotCount, n);
  const [idx, setIdx] = React.useState<number[]>([]);
  const tick = React.useRef(0);

  React.useEffect(() => {
    setIdx(Array.from({ length: slots }, (_, i) => i % Math.max(n, 1)));
  }, [slots, n]);

  React.useEffect(() => {
    if (n <= slots) return; // nothing to rotate to
    const id = window.setInterval(() => {
      const s = tick.current++ % slots;
      setIdx((cur) => cur.map((v, i) => (i === s ? (v + slots) % n : v)));
    }, 3800);
    return () => window.clearInterval(id);
  }, [n, slots]);

  return idx.map((i) => items[i]).filter(Boolean);
}

function PriceCard({ product, className, delay = 0 }: { product: ProductWithMeta; className?: string; delay?: number }) {
  const { lang } = useLanguage();
  const name = lang === 'ar' ? product.name_ar : product.name_en;
  return (
    <div className={cn('absolute z-20', className)}>
      <div className="motion-safe:animate-float" style={{ animationDelay: `${delay}s` }}>
        <div className="glass w-[176px] rounded-md p-3 sm:w-[200px]">
          <div className="flex items-center gap-2">
            <span className="icon-well h-7 w-7 shrink-0 rounded-xs">
              <Cpu className="h-3.5 w-3.5" />
            </span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={product.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className="line-clamp-1 text-xs font-medium"
              >
                {name}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t('common', 'from', lang)}
            </span>
            <CountUp
              key={product.id /* restart the count when the product changes */}
              value={product.lowest_price ?? 0}
              from={(product.lowest_price ?? 0) * 0.82}
              duration={0.9}
              format={(v) => formatEGP(Math.round(v), lang)}
              className="price text-base font-bold text-accent"
            />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-success" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            {product.offers_count} {t('common', 'offers', lang)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- main */

export function HeroVisual({ products, loading }: { products: ProductWithMeta[]; loading?: boolean }) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 90, damping: 18, mass: 0.6 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [9, -9]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-7, 7]);
  const cards = usePriceSlots(products, 3);

  const onMove = (e: React.PointerEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative mx-auto aspect-square w-full max-w-[540px] select-none [perspective:1200px]"
      aria-hidden
    >
      {/* glowing circuit board */}
      <motion.div style={{ rotateX, rotateY }} className="absolute inset-[4%] [transform-style:preserve-3d]">
        <div className="relative h-full w-full overflow-hidden rounded-lg border border-accent/30 bg-gradient-to-br from-[#0b1b2b] via-[#0c2433] to-[#0a1a28] shadow-3 shadow-glow-md">
          <svg viewBox="0 0 540 540" className="absolute inset-0 h-full w-full" fill="none">
            <defs>
              <radialGradient id="hv-glow" cx="0.5" cy="0.55" r="0.6">
                <stop offset="0" stopColor="#14d1b8" stopOpacity="0.35" />
                <stop offset="1" stopColor="#14d1b8" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="540" height="540" fill="url(#hv-glow)" />
            {[
              'M0 110 H120 L160 150 H300 L340 110 H540',
              'M0 270 H80 L120 310 H220',
              'M540 220 H430 L390 260 H330',
              'M60 540 V440 L100 400 H260',
              'M300 540 V470 L340 430 H470 L510 470 V540',
              'M200 0 V60 L240 100 V180',
              'M400 0 V80 L360 120',
            ].map((d, i) => (
              <motion.path
                key={i}
                d={d}
                stroke="#2dd4bf"
                strokeOpacity="0.55"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.8, delay: 0.4 + i * 0.15, ease: 'easeInOut' }}
              />
            ))}
            {[[120, 110], [300, 150], [340, 110], [220, 310], [330, 260], [260, 400], [470, 430], [240, 100]].map(
              ([x, y], i) => (
                <g key={i}>
                  <circle cx={x} cy={y} r="7" fill="#0b1b2b" stroke="#2dd4bf" strokeOpacity=".7" />
                  <circle cx={x} cy={y} r="2.5" fill="#5eead4" />
                </g>
              )
            )}
          </svg>
        </div>
      </motion.div>

      {/* components — different depths for parallax */}
      <Layer sx={sx} sy={sy} depth={16} className="start-[8%] top-[12%] w-[30%] -rotate-[18deg]">
        <div className="motion-safe:animate-float [animation-delay:-2s]">
          <ResistorArt className="w-full drop-shadow-xl" />
        </div>
      </Layer>
      <Layer sx={sx} sy={sy} depth={26} className="end-[4%] top-[6%] w-[36%] rotate-[9deg]">
        <div className="motion-safe:animate-float [animation-delay:-4s]">
          <SensorArt className="w-full" />
        </div>
      </Layer>
      <Layer sx={sx} sy={sy} depth={34} className="start-[7%] top-[36%] w-[60%] -rotate-[7deg]">
        <div className="motion-safe:animate-float">
          <ArduinoArt className="w-full" />
        </div>
      </Layer>
      <Layer sx={sx} sy={sy} depth={22} className="end-[12%] bottom-[8%] w-[17%] rotate-[6deg]">
        <div className="motion-safe:animate-float [animation-delay:-1s]">
          <LedArt className="w-full" />
        </div>
      </Layer>

      {/* live price cards (real data) */}
      {loading && !cards.length && (
        <>
          <div className="skeleton absolute bottom-[4%] start-[-2%] h-[88px] w-[190px] rounded-md" />
          <div className="skeleton absolute end-[-3%] top-[44%] h-[88px] w-[190px] rounded-md" />
        </>
      )}
      <Layer sx={sx} sy={sy} depth={44} className="inset-0 !pointer-events-none">
        {cards[0] && <PriceCard product={cards[0]} className="bottom-[2%] start-[-3%]" delay={0} />}
        {cards[1] && <PriceCard product={cards[1]} className="end-[-4%] top-[42%]" delay={-2.2} />}
        {cards[2] && (
          <PriceCard product={cards[2]} className="start-[26%] top-[-2%] hidden sm:block" delay={-4.1} />
        )}
      </Layer>

    </div>
  );
}

