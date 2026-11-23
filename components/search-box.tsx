'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Cpu, CornerDownLeft, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { getProducts, type ProductWithMeta } from '@/lib/catalog';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Variant = 'nav' | 'hero' | 'sheet';

export interface SearchBoxProps {
  variant?: Variant;
  className?: string;
  /** called after navigating (e.g. close the mobile sheet) */
  onNavigate?: () => void;
  autoFocus?: boolean;
}

/**
 * Search with live suggestions (thumbnail, name, price) and keyboard navigation.
 *  ↑ ↓ move · Enter open · Esc close · "/" focuses the nav one (handled by the header).
 */
export const SearchBox = React.forwardRef<HTMLInputElement, SearchBoxProps>(function SearchBox(
  { variant = 'nav', className, onNavigate, autoFocus },
  ref
) {
  const { lang, dir } = useLanguage();
  const router = useRouter();
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<ProductWithMeta[]>([]);
  const [active, setActive] = React.useState(-1);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const term = q.trim();
  // options = products + a final "see all results" row
  const optionCount = items.length + (term ? 1 : 0);

  // debounced live search
  React.useEffect(() => {
    if (term.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    const id = window.setTimeout(async () => {
      try {
        const res = await getProducts({ search: term, sort: 'relevance', limit: 6 });
        if (live) {
          setItems(res.slice(0, 6));
          setActive(-1);
        }
      } catch {
        if (live) setItems([]);
      } finally {
        if (live) setLoading(false);
      }
    }, 200);
    return () => {
      live = false;
      window.clearTimeout(id);
    };
  }, [term]);

  // close when focus leaves the whole widget
  const onBlur = (e: React.FocusEvent) => {
    if (!rootRef.current?.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
      setActive(-1);
    }
  };

  const go = (href: string) => {
    setOpen(false);
    setActive(-1);
    router.push(href);
    onNavigate?.();
  };

  const submitAll = () => term && go(`/products?q=${encodeURIComponent(term)}`);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!optionCount) return;
      e.preventDefault();
      setOpen(true);
      const down = e.key === 'ArrowDown';
      setActive((a) => (down ? (a + 1) % optionCount : a <= 0 ? optionCount - 1 : a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && active < items.length) go(`/products/${items[active].id}`);
      else submitAll();
    } else if (e.key === 'Escape') {
      if (open) {
        e.stopPropagation();
        setOpen(false);
        setActive(-1);
      } else {
        e.currentTarget.blur();
      }
    }
  };

  const showPanel = open && term.length >= 2;
  const isHero = variant === 'hero';

  return (
    <div
      ref={rootRef}
      onBlur={onBlur}
      className={cn(
        'group/search relative',
        variant === 'nav' && 'h-10 w-full',
        className
      )}
    >
      {/* field */}
      <div
        className={cn(
          'relative z-[1] flex items-center border bg-background/70 backdrop-blur-md',
          'transition-[box-shadow,border-color,width,background-color] duration-base ease-out',
          'focus-within:border-accent focus-within:bg-background focus-within:shadow-glow-md',
          isHero ? 'h-14 rounded-md px-4 shadow-2' : 'h-10 rounded-full px-3.5',
          // nav: grows on focus (overlays the nav links instead of pushing them)
          variant === 'nav' &&
            'absolute end-0 top-0 w-full focus-within:w-[min(380px,34vw)] min-[1280px]:focus-within:w-[400px]'
        )}
      >
        <Search
          className={cn(
            'shrink-0 text-muted-foreground transition-colors group-focus-within/search:text-accent',
            isHero ? 'h-5 w-5' : 'h-4 w-4'
          )}
        />
        <input
          ref={ref}
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          enterKeyHint="search"
          placeholder={t('nav', isHero ? 'search' : 'searchShort', lang)}
          className={cn(
            'min-w-0 flex-1 bg-transparent ps-2.5 pe-2 outline-none placeholder:text-muted-foreground/80',
            isHero ? 'text-base' : 'text-sm'
          )}
        />
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        ) : variant === 'nav' && !q ? (
          <kbd className="pointer-events-none shrink-0 rounded-xs border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground transition-opacity group-focus-within/search:opacity-0">
            /
          </kbd>
        ) : isHero ? (
          <button
            type="button"
            onClick={submitAll}
            aria-label={t('nav', 'searchShort', lang)}
            className="ms-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground transition-[transform,box-shadow] hover:shadow-glow motion-safe:active:scale-95"
          >
            <Arrow className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* suggestions */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onMouseDown={(e) => e.preventDefault() /* keep input focus */}
            className={cn(
              'glass absolute z-popover overflow-hidden rounded-md p-1.5',
              variant === 'nav'
                ? 'end-0 top-[calc(100%+8px)] w-[min(420px,92vw)]'
                : 'inset-x-0 top-[calc(100%+8px)]'
            )}
          >
            {items.length === 0 && !loading && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                {t('common', 'noResults', lang)}
              </div>
            )}

            {items.map((p, i) => (
              <button
                key={p.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={active === i}
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(`/products/${p.id}`)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-sm p-2 text-start transition-colors duration-fast',
                  active === i ? 'bg-accent/15' : 'hover:bg-accent/10'
                )}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xs border border-border bg-muted">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <Cpu className="h-5 w-5 text-accent/80" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {lang === 'ar' ? p.name_ar : p.name_en}
                  </span>
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">
                    {[p.brand, p.sku].filter(Boolean).join(' · ') ||
                      `${p.offers_count} ${t('common', 'offers', lang)}`}
                  </span>
                </span>
                {p.lowest_price !== null && (
                  <span className="price shrink-0 text-sm font-semibold text-accent">
                    {formatEGP(p.lowest_price, lang)}
                  </span>
                )}
              </button>
            ))}

            {term && (
              <button
                id={`${listId}-${items.length}`}
                role="option"
                aria-selected={active === items.length}
                type="button"
                onMouseEnter={() => setActive(items.length)}
                onClick={submitAll}
                className={cn(
                  'mt-1 flex w-full items-center justify-between gap-2 rounded-sm border-t border-border px-3 py-2.5 text-sm text-muted-foreground',
                  active === items.length ? 'bg-accent/15 text-foreground' : 'hover:bg-accent/10'
                )}
              >
                <span className="truncate">
                  {lang === 'ar' ? `كل النتائج لـ "${term}"` : `See all results for "${term}"`}
                </span>
                <CornerDownLeft className="h-4 w-4 shrink-0 rtl-flip" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
