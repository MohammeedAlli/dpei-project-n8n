# Electronics Souk — Style Guide (Modern Maker Tech)

Circuit-board inspired, glassy, trustworthy. Teal is the brand; amber means "best price".

## Color
| Token | Use |
|---|---|
| `primary` / `bg-primary` | Brand teal — main buttons, focus |
| `accent` | Teal for text/icons/borders (darker in light mode for AA contrast) |
| `ink` `#0B1220` | Deep navy — text on teal/amber, dark surfaces |
| `deal` | Amber — **best price only** (badge, "buy" CTA) |
| `electric`, `lime` | Sparks: gradients, charts, live dots |
| `success` / `warning` / `destructive` | Status |
| `gray-50…900` | Ink-tinted neutrals |
| `background / card / muted / border / input` | Surfaces (auto light/dark) |

Opacity works on every token: `bg-accent/10`, `border-primary/40`.

## Type
- **Display** (`font-display`): Space Grotesk (EN) / IBM Plex Sans Arabic bold (AR). Headings h1–h3 use it automatically. Arabic is never letter-spaced.
- **Body** (`font-sans`): Inter (EN) / IBM Plex Sans Arabic (AR), switched by `html[lang]`.
- **Mono** (`font-mono`, or class `price`, `sku`, `spec`): JetBrains Mono, tabular digits, forced LTR so prices don't flip in RTL.
- Scale: `text-xs 12 · sm 14 · base 16 · lg 20 · xl 24 · display-md 32 · display-lg 40 · text-hero clamp(40→72)`.

## Space / Radius / Elevation
- Space: 4/8 grid (`--space-1…24`, Tailwind `1 = 4px`).
- Radius: `rounded-xs 8` (tooltips, items) · `rounded-sm 12` (buttons, inputs) · `rounded-md 16` (cards) · `rounded-lg 24` (panels, hero cards) · `rounded-full` (chips, badges).
- Shadows: `shadow-1/2/3` layered. Hover glows: `shadow-glow`, `shadow-glow-md`, `shadow-glow-deal`.
- Borders: hairline `border`, strong `--border-strong`, glow `--border-glow`, dashed `--border-dashed`.
- Z-index: `raised 10 · sticky 40 · drawer 50 · modal 60 · popover 70 · tooltip 80 · toast 90`.

## Motion
- Durations `duration-fast 150 · base 250 · slow 400`.
- Easings `ease-out` (default UI), `ease-in-out` (loops), `ease-spring` (bounces: cart badge).
- Press = `scale(.97)`. Hover = glow, not movement (cards lift 4px max).
- `prefers-reduced-motion`: all animation/transition durations collapse; hover lifts and shimmer are removed. In Framer Motion use `useReducedMotion()`.

## Background
- `body` has a fixed layer: faint dotted grid + 3 soft gradient mesh blobs (teal / cyan / amber), tuned for both themes.
- Add `className="bg-pcb"` to any section for faint PCB traces.
- `.glass` = frosted panel (navbar, drawers, popovers).

## Components
| Component | Notes |
|---|---|
| `Button` | `default` (teal) · `deal` (amber) · `secondary` · `outline` · `ghost` · `destructive` · `link`; sizes `sm / default / lg / icon` |
| `Badge` | `default · secondary · outline · success · warning · destructive · deal · mono` |
| `Input` / native `<select>` / `<textarea>` | add class `field` for identical styling |
| `Select` (Radix) | glass dropdown, check mark on the start side |
| `Card` | `variant`: `default · glass · interactive · flat` |
| `Chip` | `selected`, optional `onRemove`, `icon` |
| `Tooltip` | ink glass bubble |
| `Skeleton` | shimmer, direction flips in RTL |

## RTL rules
Never use `left/right`, `ml/mr`, `pl/pr`, `text-left/right`. Use `ms/me`, `ps/pe`, `start/end`, `text-start/end`. Icons with direction (arrows, chevrons) → `rtl-flip` or pick by `dir`.

## Install notes
1. Replace `app/globals.css`, `tailwind.config.ts`, and the `components/ui/*` files.
2. Apply `layout-fonts.snippet.tsx` to `app/layout.tsx`.
3. Check these packages are present: `@radix-ui/react-slot`, `@radix-ui/react-tooltip`, `@radix-ui/react-select`, `class-variance-authority`, `lucide-react` (shadcn already installs them).
4. Radii grew (md 12→16, lg 16→24): glance at pages once; adjust with `rounded-sm` where you want tighter corners.
