import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Duotone line icons — one per category. Same grammar everywhere:
 *  - 2px round strokes in currentColor (ink)
 *  - soft teal fill (.duo-fill) + one teal highlight stroke (.duo-line)
 * viewBox 64×64, so they scale from 24px chips to 160px bento illustrations.
 */
export type CategoryKey =
  | 'boards' | 'raspberry' | 'sensors' | 'passive' | 'ics' | 'leds' | 'power'
  | 'cables' | 'motors' | 'relays' | 'tools' | 'kits' | 'other';

const RULES: Array<[CategoryKey, RegExp]> = [
  ['raspberry', /raspberry|raspi|rpi|راسبري|راسبيري/i],
  ['boards', /arduino|develop|board|esp|stm|micro ?controller|اردوينو|أردوينو|لوحات|متحكم/i],
  ['sensors', /sensor|حساس|مستشعر/i],
  ['passive', /resistor|capacitor|passive|inductor|مقاوم|مكثف|سلبي/i],
  ['ics', /\bics?\b|diode|transistor|regulator|chip|دائر|دايود|ترانزستور|متكامل/i],
  ['leds', /led|display|lcd|oled|screen|ليد|شاشة|شاشات|عرض/i],
  ['power', /power|batter|charger|supply|بطار|طاقة|شاحن|تغذية/i],
  ['cables', /cable|connector|wire|jumper|header|كابل|كابلات|موصل|وصلات|اسلاك|أسلاك/i],
  ['motors', /motor|servo|stepper|actuator|موتور|محرك|سيرفو/i],
  ['relays', /relay|ريلاي|مرحل|ريليه/i],
  ['tools', /tool|solder|multimeter|عدة|أدوات|ادوات|لحام/i],
  ['kits', /\bkit|starter|bundle|كيت|مجموعة|طقم/i],
];

export function categoryKey(
  cat?: { slug?: string | null; name_en?: string | null; name_ar?: string | null } | null
): CategoryKey {
  if (!cat) return 'other';
  const hay = `${cat.slug ?? ''} ${cat.name_en ?? ''} ${cat.name_ar ?? ''}`;
  return RULES.find(([, re]) => re.test(hay))?.[0] ?? 'other';
}

type P = { className?: string };
const S = 'fill-none stroke-current stroke-[2] [stroke-linecap:round] [stroke-linejoin:round]';
const FILL = 'fill-accent/20 stroke-current stroke-[2] [stroke-linecap:round] [stroke-linejoin:round]';
const HI = 'fill-none stroke-accent stroke-[2.4] [stroke-linecap:round] [stroke-linejoin:round]';

const Svg = ({ className, children }: P & { children: React.ReactNode }) => (
  <svg viewBox="0 0 64 64" className={cn('h-full w-full', className)} aria-hidden>
    {children}
  </svg>
);

const ART: Record<CategoryKey, (p: P) => JSX.Element> = {
  boards: (p) => (
    <Svg {...p}>
      <rect x="6" y="14" width="52" height="38" rx="5" className={FILL} />
      <rect x="6" y="22" width="12" height="13" rx="2" className={S} />
      <rect x="30" y="26" width="16" height="12" rx="2" className={HI} />
      <path d="M24 19h22M24 47h22" className={S} />
      <circle cx="52" cy="26" r="1.6" className="fill-accent" />
      <circle cx="52" cy="32" r="1.6" className="fill-current" />
    </Svg>
  ),
  raspberry: (p) => (
    <Svg {...p}>
      <rect x="6" y="14" width="52" height="36" rx="4" className={FILL} />
      <path d="M12 19h30M12 24h30" className={S} strokeDasharray="1.5 3.5" />
      <rect x="21" y="29" width="14" height="14" rx="2" className={HI} />
      <rect x="44" y="26" width="14" height="9" rx="1.5" className={S} />
      <rect x="44" y="38" width="14" height="9" rx="1.5" className={S} />
      <circle cx="12" cy="44" r="1.6" className="fill-current" />
    </Svg>
  ),
  sensors: (p) => (
    <Svg {...p}>
      <rect x="6" y="14" width="52" height="30" rx="5" className={FILL} />
      <circle cx="21" cy="29" r="9" className={HI} />
      <circle cx="21" cy="29" r="3.5" className={S} />
      <circle cx="43" cy="29" r="9" className={HI} />
      <circle cx="43" cy="29" r="3.5" className={S} />
      <path d="M20 44v10M28 44v10M36 44v10M44 44v10" className={S} />
    </Svg>
  ),
  passive: (p) => (
    <Svg {...p}>
      <path d="M2 32h14M48 32h14" className={S} />
      <rect x="14" y="21" width="36" height="22" rx="11" className={FILL} />
      <path d="M24 21v22M31 21v22M38 21v22" className={S} />
      <path d="M38 21v22" className={HI} />
    </Svg>
  ),
  ics: (p) => (
    <Svg {...p}>
      <path d="M12 18h-6M12 27h-6M12 36h-6M12 45h-6M52 18h6M52 27h6M52 36h6M52 45h6" className={S} />
      <rect x="12" y="10" width="40" height="44" rx="4" className={FILL} />
      <path d="M26 10a6 6 0 0 0 12 0" className={HI} />
      <circle cx="19" cy="47" r="2" className="fill-current" />
      <path d="M26 30h12M26 38h12" className={S} />
    </Svg>
  ),
  leds: (p) => (
    <Svg {...p}>
      <path d="M20 36V24a12 12 0 0 1 24 0v12z" className={FILL} />
      <path d="M16 36h32M26 36v18M38 36v14" className={S} />
      <path d="M26 20a6 6 0 0 1 4-4" className={HI} />
      <path d="M8 12l5 4M56 12l-5 4M32 3v5" className={HI} />
    </Svg>
  ),
  power: (p) => (
    <Svg {...p}>
      <rect x="6" y="20" width="44" height="26" rx="5" className={FILL} />
      <path d="M50 29h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4" className={S} />
      <path d="M30 24l-8 10h8l-4 8 12-12h-8l4-6z" className={HI} />
    </Svg>
  ),
  cables: (p) => (
    <Svg {...p}>
      <rect x="6" y="22" width="22" height="20" rx="3" className={FILL} />
      <path d="M12 22v-5M17 22v-5M22 22v-5" className={S} />
      <path d="M28 32h6c8 0 6 14 14 14h10" className={HI} />
      <rect x="48" y="40" width="10" height="12" rx="2" className={S} />
    </Svg>
  ),
  motors: (p) => (
    <Svg {...p}>
      <rect x="8" y="18" width="34" height="28" rx="6" className={FILL} />
      <path d="M42 28h12v8H42" className={S} />
      <path d="M54 26v12" className={HI} />
      <path d="M16 18v-4M26 18v-4M34 18v-4" className={S} />
      <circle cx="24" cy="32" r="5" className={S} />
    </Svg>
  ),
  relays: (p) => (
    <Svg {...p}>
      <rect x="6" y="14" width="52" height="36" rx="5" className={FILL} />
      <path d="M14 38l4-6 4 6 4-6 4 6" className={S} />
      <circle cx="42" cy="26" r="2.4" className="fill-current" />
      <circle cx="50" cy="38" r="2.4" className="fill-accent" />
      <path d="M42 26l6 10" className={HI} />
      <path d="M12 50v6M52 50v6" className={S} />
    </Svg>
  ),
  tools: (p) => (
    <Svg {...p}>
      <path d="M14 50l22-22" className={S} />
      <rect x="8" y="46" width="12" height="9" rx="2" transform="rotate(-45 14 50)" className={FILL} />
      <path d="M36 28l4-4 8 8-4 4z" className={HI} />
      <path d="M44 14a9 9 0 0 0-9 11l-5 5 6 6 5-5a9 9 0 0 0 11-9l-6 3-4-4z" className={FILL} />
    </Svg>
  ),
  kits: (p) => (
    <Svg {...p}>
      <path d="M32 8l22 11v26L32 56 10 45V19z" className={FILL} />
      <path d="M10 19l22 11 22-11M32 30v26" className={S} />
      <path d="M21 13.5l22 11" className={HI} />
    </Svg>
  ),
  other: (p) => (
    <Svg {...p}>
      <rect x="9" y="9" width="20" height="20" rx="5" className={FILL} />
      <rect x="35" y="9" width="20" height="20" rx="5" className={S} />
      <rect x="9" y="35" width="20" height="20" rx="5" className={S} />
      <rect x="35" y="35" width="20" height="20" rx="5" className={HI} />
    </Svg>
  ),
};

export function CategoryArt({ kind, className }: { kind: CategoryKey; className?: string }) {
  const Art = ART[kind] ?? ART.other;
  return <Art className={className} />;
}
