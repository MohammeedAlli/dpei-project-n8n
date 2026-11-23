'use client';

import * as React from 'react';
import * as Slider from '@radix-ui/react-slider';
import { useLanguage } from '@/components/providers/language-provider';
import { formatEGP } from '@/lib/format';

/** Dual-handle price range with live values. Radix handles RTL via `dir`. */
export function PriceSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const { lang, dir } = useLanguage();
  const step = max - min > 2000 ? 50 : max - min > 300 ? 10 : 1;
  const [local, setLocal] = React.useState<[number, number]>(value);
  React.useEffect(() => setLocal(value), [value]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="price rounded-xs border border-border bg-muted/60 px-2 py-1 text-xs font-semibold">
          {formatEGP(local[0], lang)}
        </span>
        <span className="h-px flex-1 bg-border" />
        <span className="price rounded-xs border border-border bg-muted/60 px-2 py-1 text-xs font-semibold">
          {formatEGP(local[1], lang)}
        </span>
      </div>
      <Slider.Root
        dir={dir}
        min={min}
        max={max}
        step={step}
        minStepsBetweenThumbs={1}
        value={local}
        onValueChange={(v) => setLocal([v[0], v[1]])}
        onValueCommit={(v) => onChange([v[0], v[1]])}
        className="relative flex h-6 w-full touch-none select-none items-center"
      >
        <Slider.Track className="relative h-1.5 grow rounded-full bg-muted">
          <Slider.Range className="absolute h-full rounded-full bg-gradient-to-r from-primary to-electric" />
        </Slider.Track>
        {[0, 1].map((i) => (
          <Slider.Thumb
            key={i}
            aria-label={i === 0 ? 'Min price' : 'Max price'}
            className="block h-5 w-5 rounded-full border-2 border-accent bg-background shadow-2 transition-[transform,box-shadow] duration-fast hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-110"
          />
        ))}
      </Slider.Root>
    </div>
  );
}
