import * as React from 'react';
import type { CategoryKey } from '@/components/category-art';

/**
 * Full-bleed illustration behind each category card on the home page.
 * Drawn with theme colours (so it follows light / dark) and anchored to the end side of the card,
 * with a fade on the text side so the name and count stay readable. Mirrored in RTL.
 */
const c = (v: string, a: number) => `hsl(var(--${v}) / ${a})`;
const ACC = { fill: c('accent', 0.22), stroke: c('accent', 0.8) };
const ACC2 = { fill: c('electric', 0.2), stroke: c('electric', 0.85) };
const INK = { fill: c('foreground', 0.1), stroke: c('foreground', 0.4) };
const INK2 = { fill: c('foreground', 0.22), stroke: c('foreground', 0.5) };
const LINE = { fill: 'none', stroke: c('foreground', 0.35) };
const LINEA = { fill: 'none', stroke: c('accent', 0.8) };

const Traces = () => (
  <g style={LINE} opacity={0.55}>
    <path d="M150 30h60l16 16h60M130 120h70l14 14h50M170 210h80l14-14h70M360 30v40l12 12M390 150h-40l-14 14" />
    <circle cx="150" cy="30" r="3" style={ACC} />
    <circle cx="130" cy="120" r="3" style={ACC} />
    <circle cx="170" cy="210" r="3" style={ACC} />
    <circle cx="360" cy="30" r="3" style={ACC} />
  </g>
);

const SCENES: Record<CategoryKey, () => JSX.Element> = {
  boards: () => (
    <g transform="rotate(-8 300 125)">
      <rect x="196" y="48" width="196" height="140" rx="10" style={ACC} />
      <rect x="184" y="72" width="44" height="38" rx="4" style={INK} />
      <rect x="184" y="126" width="30" height="34" rx="4" style={INK} />
      <rect x="286" y="88" width="54" height="42" rx="4" style={INK2} />
      <path d="M240 60h124M240 176h124" style={LINE} strokeDasharray="2 7" strokeWidth={9} />
      <circle cx="368" cy="96" r="4" style={ACC2} />
      <circle cx="368" cy="112" r="4" style={INK2} />
      <circle cx="368" cy="128" r="4" style={ACC} />
      <path d="M250 100h30M250 118h30M340 150h22" style={LINEA} />
    </g>
  ),
  raspberry: () => (
    <g transform="rotate(6 300 125)">
      <rect x="192" y="52" width="200" height="134" rx="9" style={ACC} />
      <path d="M204 66h150M204 76h150" style={LINE} strokeDasharray="2 6" strokeWidth={7} />
      <rect x="250" y="102" width="46" height="46" rx="4" style={INK2} />
      <rect x="338" y="92" width="62" height="34" rx="3" style={INK} />
      <rect x="338" y="132" width="62" height="34" rx="3" style={INK} />
      <rect x="206" y="152" width="30" height="22" rx="3" style={INK} />
      <circle cx="210" cy="106" r="5" style={ACC2} />
    </g>
  ),
  sensors: () => (
    <g>
      <rect x="196" y="70" width="190" height="96" rx="10" style={ACC} />
      <circle cx="252" cy="118" r="34" style={INK} />
      <circle cx="252" cy="118" r="18" style={INK2} />
      <circle cx="334" cy="118" r="34" style={INK} />
      <circle cx="334" cy="118" r="18" style={INK2} />
      <path d="M222 166v34M246 166v34M270 166v34M294 166v34" style={LINE} strokeWidth={5} />
      <path d="M180 40a40 40 0 0 1 56 0M172 28a56 56 0 0 1 72 0" style={LINEA} />
    </g>
  ),
  passive: () => (
    <g>
      <path d="M176 150h54M330 150h50" style={LINE} strokeWidth={5} />
      <rect x="230" y="126" width="100" height="48" rx="24" style={ACC} />
      <path d="M254 126v48M274 126v48M294 126v48" style={{ fill: 'none', stroke: 'hsl(35 90% 55% / .8)' }} strokeWidth={8} />
      <path d="M300 60h60M300 110h60" style={LINE} strokeWidth={5} opacity={0} />
      <rect x="296" y="42" width="50" height="62" rx="6" style={ACC2} />
      <path d="M308 42v62" style={LINE} strokeWidth={4} />
      <path d="M312 104v18M332 104v18" style={LINE} strokeWidth={4} />
    </g>
  ),
  ics: () => (
    <g>
      <rect x="230" y="60" width="130" height="100" rx="8" style={INK2} />
      <circle cx="250" cy="78" r="5" style={ACC2} />
      <path d="M244 60v-22M268 60v-22M292 60v-22M316 60v-22M340 60v-22M244 160v22M268 160v22M292 160v22M316 160v22M340 160v22" style={LINE} strokeWidth={5} />
      <path d="M262 100h66M262 120h66M262 140h40" style={LINEA} />
      <path d="M190 190c0-26 36-26 36 0z" style={ACC} />
      <path d="M200 190v22M208 190v22M216 190v22" style={LINE} strokeWidth={3} />
      <path d="M372 180l16 28h-32z" style={ACC2} />
    </g>
  ),
  leds: () => (
    <g>
      <g transform="translate(236 120)">
        <path d="M-26 40V-10a26 26 0 0 1 52 0V40z" style={ACC} />
        <path d="M-12 40v50M12 40v70" style={LINE} strokeWidth={4} />
        <path d="M-40-40l-14-14M0-52v-20M40-40l14-14" style={LINEA} strokeWidth={3} />
      </g>
      <g transform="translate(330 120)">
        <rect x="-34" y="-58" width="68" height="108" rx="8" style={INK} />
        <path d="M-18-40h36M-22-36v32M22-36v32M-18 0h36M-22 4v32M22 4v32M-18 40h36" style={LINEA} strokeWidth={5} />
      </g>
    </g>
  ),
  power: () => (
    <g transform="rotate(-10 300 125)">
      <rect x="214" y="70" width="170" height="90" rx="12" style={INK} />
      <rect x="384" y="97" width="14" height="36" rx="4" style={INK2} />
      <rect x="226" y="82" width="60" height="66" rx="6" style={ACC} />
      <rect x="292" y="82" width="40" height="66" rx="6" style={ACC} opacity={0.6} />
      <path d="M268 90l-18 32h20l-12 26" style={LINEA} strokeWidth={4} />
    </g>
  ),
  cables: () => (
    <g fill="none" strokeWidth={7} strokeLinecap="round">
      <path d="M180 190c60-90 90 20 150-70s20-50 40-60" stroke="hsl(173 70% 45% / .75)" />
      <path d="M190 215c60-60 100 10 150-40s20-60 50-70" stroke="hsl(35 90% 55% / .7)" />
      <path d="M176 160c50-90 110-30 160-80" stroke="hsl(350 75% 60% / .65)" />
      <rect x="170" y="146" width="22" height="26" rx="3" style={INK2} />
      <rect x="362" y="38" width="22" height="26" rx="3" style={INK2} />
    </g>
  ),
  motors: () => (
    <g>
      <rect x="214" y="78" width="120" height="80" rx="8" style={ACC} />
      <rect x="334" y="104" width="22" height="28" rx="3" style={INK2} />
      <circle cx="368" cy="118" r="26" style={INK} />
      <circle cx="368" cy="118" r="8" style={ACC2} />
      <path d="M368 118l30-28" style={LINEA} strokeWidth={9} />
      <path d="M232 158v34M262 158v34M292 158v34" style={LINE} strokeWidth={5} />
      <path d="M204 40a50 50 0 0 1 84-10" style={LINEA} strokeDasharray="4 7" />
    </g>
  ),
  relays: () => (
    <g>
      <rect x="214" y="58" width="150" height="110" rx="8" style={INK} />
      <rect x="230" y="74" width="62" height="78" rx="4" style={ACC} />
      <path d="M244 90h34M244 104h34M244 118h34M244 132h34" style={LINEA} strokeWidth={3} />
      <path d="M312 150v-40l30-20" style={LINE} strokeWidth={4} />
      <circle cx="312" cy="150" r="5" style={ACC2} />
      <circle cx="346" cy="88" r="5" style={INK2} />
      <path d="M232 168v28M276 168v28M322 168v28M350 168v28" style={LINE} strokeWidth={5} />
    </g>
  ),
  tools: () => (
    <g>
      <g transform="rotate(-35 270 130)">
        <rect x="190" y="118" width="130" height="24" rx="10" style={ACC} />
        <path d="M320 126l50 4-50 6z" style={INK2} />
        <path d="M150 130h40" style={LINEA} strokeWidth={5} />
      </g>
      <rect x="322" y="62" width="70" height="110" rx="10" style={INK} />
      <rect x="332" y="72" width="50" height="26" rx="3" style={ACC2} />
      <circle cx="357" cy="130" r="18" style={ACC} />
      <path d="M357 130l10-10" style={LINEA} strokeWidth={3} />
    </g>
  ),
  kits: () => (
    <g>
      <path d="M200 110l86-36 100 36v78l-100 36-86-36z" style={ACC} />
      <path d="M200 110l86 36 100-36M286 146v78" style={LINE} />
      <circle cx="262" cy="86" r="14" style={ACC2} />
      <rect x="296" y="64" width="40" height="22" rx="4" style={INK2} />
      <path d="M340 70l22-20" style={LINEA} strokeWidth={4} />
    </g>
  ),
  other: () => (
    <g>
      <circle cx="300" cy="120" r="48" style={ACC} />
      <circle cx="300" cy="120" r="22" style={INK2} />
      <path d="M300 72V30M300 168v42M252 120h-52M348 120h52" style={LINE} strokeWidth={4} />
    </g>
  ),
};

export function CategoryBackdrop({ kind }: { kind: CategoryKey }) {
  const Scene = SCENES[kind] ?? SCENES.other;
  return (
    <>
      <svg
        aria-hidden
        viewBox="0 0 400 240"
        preserveAspectRatio="xMaxYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full origin-[80%_50%] transition-transform duration-slow ease-out group-hover:scale-[1.06] rtl:-scale-x-100 rtl:group-hover:[transform:scaleX(-1.06)_scaleY(1.06)]"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Traces />
        <Scene />
      </svg>
      {/* fade on the text side */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card via-card/75 to-transparent rtl:bg-gradient-to-l"
      />
    </>
  );
}
