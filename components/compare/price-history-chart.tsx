'use client';

import * as React from 'react';
import { History } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { getPriceHistory, type HistoryPoint } from '@/lib/price-data';
import { formatEGP } from '@/lib/format';
import { cn } from '@/lib/utils';

const W = 640;
const H = 220;
const PAD = { l: 8, r: 8, t: 16, b: 24 };

export function PriceHistoryChart({ productId }: { productId: string }) {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [days, setDays] = React.useState<30 | 90>(30);
  const [state, setState] = React.useState<{ loading: boolean; available: boolean; points: HistoryPoint[] }>({
    loading: true,
    available: false,
    points: [],
  });
  const [hover, setHover] = React.useState<number | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    getPriceHistory(productId, days)
      .then((r) => live && setState({ loading: false, ...r }))
      .catch(() => live && setState({ loading: false, available: false, points: [] }));
    return () => {
      live = false;
    };
  }, [productId, days]);

  const { points, available, loading } = state;
  const geo = React.useMemo(() => {
    if (!points.length) return null;
    const lo = Math.min(...points.map((p) => p.min));
    const hi = Math.max(...points.map((p) => p.min));
    const span = hi - lo || Math.max(1, lo * 0.1);
    const x = (i: number) => PAD.l + (i / Math.max(1, points.length - 1)) * (W - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + (1 - (v - (lo - span * 0.15)) / (span * 1.3)) * (H - PAD.t - PAD.b);
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.min).toFixed(1)}`).join(' ');
    const area = `${line} L${x(points.length - 1)} ${H - PAD.b} L${x(0)} ${H - PAD.b} Z`;
    return { x, y, line, area, lo, hi };
  }, [points]);

  const fmtDay = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || !points.length) return;
    const rel = (e.clientX - r.left) / r.width;
    const frac = rel; // chart axis is always left→right (time)
    setHover(Math.min(points.length - 1, Math.max(0, Math.round(frac * (points.length - 1)))));
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (!points.length) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      setHover((h) => Math.min(points.length - 1, Math.max(0, (h ?? points.length - 1) + dir)));
    }
  };

  const hp = hover !== null ? points[hover] : null;

  return (
    <section aria-labelledby="ph-title" className="rounded-md border border-border bg-card p-4 shadow-1 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 id="ph-title" className="flex items-center gap-2 font-display text-base font-semibold">
          <History className="h-4 w-4 text-accent" />
          {L('تاريخ السعر', 'Price history')}
        </h3>
        <div className="flex rounded-sm border border-input p-0.5" role="group" aria-label={L('الفترة', 'Range')}>
          {([30, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={days === d}
              onClick={() => setDays(d)}
              className={cn(
                'rounded-xs px-3 py-1 text-xs font-semibold transition-colors',
                days === d ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {d} {L('يوم', 'd')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-[220px] w-full" />
      ) : !available || !geo ? (
        <div className="flex h-[180px] flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border px-6 text-center">
          <History className="h-6 w-6 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            {L(
              'بنبدأ نسجّل تغيّر السعر من النهارده. الرسم هيظهر بعد ما السعر يتغيّر أو يعدّي يوم.',
              'We just started recording price changes. The chart appears once there is more than one day of data.'
            )}
          </p>
        </div>
      ) : (
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full touch-pan-y select-none text-accent outline-none focus-visible:ring-2 focus-visible:ring-ring"
            role="img"
            tabIndex={0}
            aria-label={L(
              `أقل سعر خلال ${days} يوم: من ${formatEGP(geo.lo, 'ar')} إلى ${formatEGP(geo.hi, 'ar')}`,
              `Lowest price over ${days} days, from ${formatEGP(geo.lo, 'en')} to ${formatEGP(geo.hi, 'en')}`
            )}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            onKeyDown={onKey}
            onBlur={() => setHover(null)}
          >
            <defs>
              <linearGradient id="ph-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="currentColor" stopOpacity=".28" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.5, 1].map((f) => (
              <line key={f} x1={PAD.l} x2={W - PAD.r} y1={PAD.t + f * (H - PAD.t - PAD.b)} y2={PAD.t + f * (H - PAD.t - PAD.b)} className="stroke-border" strokeDasharray="3 4" />
            ))}
            <path d={geo.area} fill="url(#ph-fill)" />
            <path d={geo.line} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
            {hover !== null && hp && (
              <g>
                <line x1={geo.x(hover)} x2={geo.x(hover)} y1={PAD.t} y2={H - PAD.b} className="stroke-foreground/30" strokeDasharray="3 3" />
                <circle cx={geo.x(hover)} cy={geo.y(hp.min)} r="5" className="fill-background" stroke="currentColor" strokeWidth="2.5" />
              </g>
            )}
            <text x={PAD.l} y={H - 6} className="fill-muted-foreground text-[11px]">{fmtDay(points[0].day)}</text>
            <text x={W - PAD.r} y={H - 6} textAnchor="end" className="fill-muted-foreground text-[11px]">{fmtDay(points[points.length - 1].day)}</text>
          </svg>

          {hp && hover !== null && (
            <div
              role="status"
              dir="ltr" className="glass pointer-events-none absolute top-2 z-10 min-w-[150px] rounded-sm p-2.5 text-xs shadow-3"
              style={{
                left: `clamp(0px, calc(${(hover / Math.max(1, points.length - 1)) * 100}% - 75px), calc(100% - 160px))`,
              }}
            >
              <div className="mb-1 font-semibold">{fmtDay(hp.day)}</div>
              <div className="price text-sm font-bold text-teal-800 dark:text-accent">{formatEGP(hp.min, lang)}</div>
              {Object.entries(hp.byShop).slice(0, 4).map(([shop, price]) => (
                <div key={shop} className="flex justify-between gap-3 text-muted-foreground">
                  <span className="truncate">{shop}</span>
                  <span className="price">{formatEGP(price, lang)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
