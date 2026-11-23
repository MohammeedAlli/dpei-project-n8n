'use client';

import * as React from 'react';
import { ZoomIn } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { CategoryArt, type CategoryKey } from '@/components/category-art';
import { Modal } from '@/components/ui/overlay';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Image gallery: thumbnails (when >1 image), hover-magnifier on desktop, click → full-size viewer.
 * With no usable image it shows the category illustration instead.
 */
export function Gallery({ images, alt, kind }: { images: string[]; alt: string; kind: CategoryKey }) {
  const { lang } = useLanguage();
  const [index, setIndex] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const [zoom, setZoom] = React.useState<{ x: number; y: number } | null>(null);
  const [open, setOpen] = React.useState(false);
  const [broken, setBroken] = React.useState<Set<number>>(new Set());
  const usable = images.filter((_, i) => !broken.has(i));
  const src = usable[index] ?? null;

  React.useEffect(() => setLoaded(false), [src]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="space-y-3">
      <div
        className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-gradient-to-br from-muted via-card to-accent/10 shadow-2"
        onPointerMove={onMove}
        onPointerLeave={() => setZoom(null)}
      >
        {src ? (
          <>
            {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={lang === 'ar' ? 'تكبير الصورة' : 'Zoom image'}
              className="absolute inset-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                onLoad={() => setLoaded(true)}
                onError={() => setBroken((b) => new Set(b).add(images.indexOf(src)))}
                className={cn('h-full w-full object-contain p-8 transition-opacity duration-slow', loaded ? 'opacity-100' : 'opacity-0')}
                style={zoom ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%`, transition: 'transform-origin 60ms linear, transform 200ms' } : { transition: 'transform 250ms' }}
              />
            </button>
            <span className="pointer-events-none absolute end-3 top-3 flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium backdrop-blur">
              <ZoomIn className="h-3.5 w-3.5" />
              {lang === 'ar' ? 'تكبير' : 'Zoom'}
            </span>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute h-1/2 w-1/2 rounded-full bg-accent/20 blur-3xl" />
            <CategoryArt kind={kind} className="relative h-2/5 w-2/5 text-foreground/70" />
          </div>
        )}
      </div>

      {usable.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto" aria-label={lang === 'ar' ? 'صور المنتج' : 'Product images'}>
          {usable.map((u, i) => (
            <li key={u}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1} / ${usable.length}`}
                aria-current={i === index}
                className={cn(
                  'h-16 w-16 overflow-hidden rounded-sm border-2 bg-card transition-[border-color,box-shadow]',
                  i === index ? 'border-accent shadow-glow' : 'border-border hover:border-accent/50'
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="h-full w-full object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open && !!src} onClose={() => setOpen(false)} label={alt} className="max-w-4xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {src && <img src={src} alt={alt} className="max-h-[85dvh] w-full bg-white object-contain p-6" />}
      </Modal>
    </div>
  );
}
