'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  Cpu,
  ShoppingCart,
  Moon,
  Sun,
  Menu,
  X,
  PackageSearch,
  Scale,
  Sparkles,
  Truck,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { SearchBox } from '@/components/search-box';
import { Button } from '@/components/ui/button';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'home', href: '/', icon: Cpu },
  { key: 'products', href: '/products', icon: PackageSearch },
  { key: 'compare', href: '/compare', icon: Scale },
  { key: 'assistant', href: '/assistant', icon: Sparkles },
  { key: 'track', href: '/track', icon: Truck },
] as const;

const iconBtn = 'h-10 w-10 rounded-full text-foreground/80 hover:bg-accent/10 hover:text-foreground';

/* ------------------------------------------------------------------ helpers */

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  // portal to <body>: the header has backdrop-filter, which would trap `position: fixed`
  return mounted ? createPortal(children, document.body) : null;
}

/** lock page scroll + close on Escape while an overlay is open */
function useOverlay(open: boolean, onClose: () => void) {
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
}

/* ------------------------------------------------------------------ toggles */

function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const { lang } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === 'dark';
  const label = t('nav', 'toggleTheme', lang);

  return (
    <Button
      variant="ghost"
      size={withLabel ? 'default' : 'icon'}
      className={cn(withLabel ? 'flex-1 justify-center gap-2 rounded-md border border-border' : iconBtn)}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={label}
      title={label}
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={dark ? 'sun' : 'moon'}
            initial={{ rotate: -90, scale: 0.3, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.3, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {dark ? <Sun className="h-[18px] w-[18px] text-deal" /> : <Moon className="h-[18px] w-[18px]" />}
          </motion.span>
        </AnimatePresence>
      </span>
      {withLabel && <span>{label}</span>}
    </Button>
  );
}

function LangToggle({ withLabel = false }: { withLabel?: boolean }) {
  const { lang, toggle } = useLanguage();
  const label = t('nav', 'language', lang); // shows the *other* language
  return (
    <Button
      variant="ghost"
      size={withLabel ? 'default' : 'icon'}
      className={cn(withLabel ? 'flex-1 justify-center gap-2 rounded-md border border-border' : iconBtn)}
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <span className="relative flex h-5 w-6 items-center justify-center [perspective:300px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={lang}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center text-[13px] font-bold leading-none"
          >
            {lang === 'ar' ? 'EN' : 'ع'}
          </motion.span>
        </AnimatePresence>
      </span>
      {withLabel && <span>{label}</span>}
    </Button>
  );
}

/* ---------------------------------------------------------------- mini cart */

function MiniCart({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang, dir } = useLanguage();
  const { items, setQty, remove, count } = useCart();
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  // drawer sits on the inline-end edge: right in LTR, left in RTL
  const off = dir === 'rtl' ? '-100%' : '100%';

  useOverlay(open, onClose);
  React.useEffect(() => {
    if (open) window.setTimeout(() => closeRef.current?.focus(), 60);
  }, [open]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              className="fixed inset-0 z-drawer bg-ink/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label={t('cart', 'title', lang)}
              dir={dir}
              initial={{ x: off }}
              animate={{ x: 0 }}
              exit={{ x: off }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="glass fixed inset-y-0 end-0 z-drawer flex w-[min(420px,100vw)] flex-col !rounded-none border-y-0 border-e-0 !bg-background/90"
            >
              <header className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="h-5 w-5 text-accent" />
                  <h2 className="font-display text-lg font-semibold">{t('cart', 'title', lang)}</h2>
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-xs text-accent">
                    {count}
                  </span>
                </div>
                <Button ref={closeRef} variant="ghost" size="icon" className={iconBtn} onClick={onClose} aria-label="Close">
                  <X className="h-5 w-5" />
                </Button>
              </header>

              {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
                  <span className="icon-well h-16 w-16 rounded-md">
                    <ShoppingCart className="h-7 w-7" />
                  </span>
                  <p className="font-semibold">{t('cart', 'empty', lang)}</p>
                  <p className="text-sm text-muted-foreground">{t('cart', 'emptyHint', lang)}</p>
                  <Button asChild onClick={onClose} className="mt-2">
                    <Link href="/products">{t('nav', 'products', lang)}</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <ul className="flex-1 space-y-3 overflow-y-auto p-5">
                    <AnimatePresence initial={false}>
                      {items.map((it) => (
                        <motion.li
                          key={it.offer_id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: dir === 'rtl' ? -40 : 40 }}
                          transition={{ duration: 0.2 }}
                          className="flex gap-3 rounded-md border border-border bg-card/70 p-3"
                        >
                          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted">
                            {it.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={it.image_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Cpu className="h-6 w-6 text-accent/80" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-medium leading-snug">
                              {lang === 'ar' ? it.product_name_ar : it.product_name_en}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{it.shop_name}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center rounded-full border border-border">
                                <button
                                  type="button"
                                  aria-label="−"
                                  onClick={() => setQty(it.offer_id, it.quantity - 1)}
                                  className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-accent/10"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-6 text-center font-mono text-xs">{it.quantity}</span>
                                <button
                                  type="button"
                                  aria-label="+"
                                  onClick={() => setQty(it.offer_id, it.quantity + 1)}
                                  className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-accent/10"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <span className="price text-sm font-semibold text-accent">
                                {formatEGP(it.unit_price * it.quantity, lang)}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(it.offer_id)}
                            aria-label={t('cart', 'remove', lang)}
                            className="self-start rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>

                  <footer className="space-y-3 border-t border-border p-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('cart', 'subtotal', lang)}</span>
                      <span className="price text-lg font-bold">{formatEGP(subtotal, lang)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild variant="outline" onClick={onClose}>
                        <Link href="/cart">{t('nav', 'cart', lang)}</Link>
                      </Button>
                      <Button asChild onClick={onClose} className="group">
                        <Link href="/checkout">
                          {t('cart', 'checkout', lang)}
                          <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                        </Link>
                      </Button>
                    </div>
                  </footer>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/* ------------------------------------------------------------- mobile sheet */

function MobileSheet({
  open,
  onClose,
  isActive,
}: {
  open: boolean;
  onClose: () => void;
  isActive: (href: string) => boolean;
}) {
  const { lang, dir } = useLanguage();
  useOverlay(open, onClose);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            dir={dir}
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
            className="bg-pcb fixed inset-0 z-modal flex flex-col overflow-y-auto bg-background/95 backdrop-blur-2xl"
          >
            <div className="container flex h-16 shrink-0 items-center justify-between">
              <span className="font-display text-lg font-bold">
                Electro Hub
              </span>
              <Button variant="ghost" size="icon" className={iconBtn} onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="container flex flex-1 flex-col gap-6 pb-8 pt-2">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SearchBox variant="sheet" onNavigate={onClose} className="relative z-10" />
              </motion.div>

              <nav className="flex flex-col gap-2" aria-label="Main">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, x: dir === 'rtl' ? 24 : -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-4 rounded-md border px-4 py-3.5 font-display text-xl font-semibold',
                        isActive(item.href)
                          ? 'border-accent/40 bg-accent/15 text-foreground shadow-glow'
                          : 'border-transparent text-foreground/80 hover:bg-accent/10'
                      )}
                    >
                      <item.icon className={cn('h-5 w-5', isActive(item.href) && 'text-accent')} />
                      {t('nav', item.key, lang)}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <motion.div
                className="mt-auto flex gap-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <LangToggle withLabel />
                <ThemeToggle withLabel />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/* ------------------------------------------------------------------- header */

export function SiteHeader() {
  const { lang } = useLanguage();
  const { count } = useCart();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState<string | null>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const closeMobile = React.useCallback(() => setMobileOpen(false), []);
  const closeCart = React.useCallback(() => setCartOpen(false), []);

  React.useEffect(() => setMounted(true), []);

  // thin border + shadow on scroll (no height change)
  React.useEffect(() => {
    // hysteresis (set at 24, clear at 4) so the state can never flip-flop around a single threshold
    const onScroll = () => setScrolled((was) => (was ? window.scrollY > 4 : window.scrollY > 24));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close overlays on navigation
  React.useEffect(() => {
    setMobileOpen(false);
    setCartOpen(false);
  }, [pathname]);

  // "/" focuses search (desktop) or opens the sheet (mobile)
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      event.preventDefault();
      if (window.matchMedia('(min-width: 1024px)').matches) searchRef.current?.focus();
      else setMobileOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // bounce the badge when something is added
  const prevCount = React.useRef(count);
  const [bump, setBump] = React.useState(0);
  React.useEffect(() => {
    if (mounted && count > prevCount.current) setBump((b) => b + 1);
    prevCount.current = count;
  }, [count, mounted]);

  const isActive = React.useCallback(
    (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href)),
    [pathname]
  );
  const cartLabel = t('nav', 'cart', lang);

  return (
    <MotionConfig reducedMotion="user">
      <header
        className={cn(
          'sticky top-0 z-sticky w-full border-b backdrop-blur-xl backdrop-saturate-150',
          'transition-[background-color,border-color,box-shadow] duration-base ease-out',
          scrolled
            ? 'border-border bg-background/75 shadow-2'
            : 'border-transparent bg-background/40'
        )}
      >
        <div
          className={cn(
            // constant height: changing it moved the whole page under the cursor and made the header shake at scrollY≈12
            'container flex h-16 items-center gap-3'
          )}
        >
          {/* hamburger (mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(iconBtn, 'lg:hidden')}
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* logo */}
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="Electro Hub">
            <span
              className={cn(
                'flex items-center justify-center rounded-sm bg-brand-gradient text-primary-foreground shadow-glow',
                'transition-[height,width,transform] duration-base ease-out group-hover:rotate-[-6deg] group-hover:scale-105',
                scrolled ? 'h-8 w-8' : 'h-10 w-10'
              )}
            >
              <Cpu className={cn('transition-all duration-base', scrolled ? 'h-4 w-4' : 'h-5 w-5')} />
            </span>
            <span className="hidden font-display text-lg font-bold tracking-tight sm:inline-block">
              Electro Hub
            </span>
          </Link>

          {/* desktop nav with sliding pill (follows hover, rests on the active link) */}
          <nav
            className="relative ms-4 hidden shrink-0 items-center gap-1 lg:flex"
            aria-label="Main"
            onMouseLeave={() => setHovered(null)}
          >
            {navItems.map((item) => {
              const active = isActive(item.href);
              const showPill = hovered ? hovered === item.key : active;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  onMouseEnter={() => setHovered(item.key)}
                  onFocus={() => setHovered(item.key)}
                  onBlur={() => setHovered(null)}
                  className={cn(
                    'relative z-0 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-fast',
                    active || hovered === item.key ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {showPill && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full border border-accent/30 bg-accent/15 shadow-glow"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  {t('nav', item.key, lang)}
                </Link>
              );
            })}
          </nav>

          <div className="ms-auto flex items-center gap-2">
            {/* search — reserves a fixed slot, expands over the nav on focus */}
            <div className="relative hidden h-10 w-[190px] shrink-0 lg:block xl:w-[260px]">
              <SearchBox ref={searchRef} variant="nav" />
            </div>

            <div className="flex items-center gap-0.5">
              <LangToggle />
              <ThemeToggle />

              <motion.button
                type="button"
                onClick={() => setCartOpen(true)}
                aria-label={cartLabel}
                aria-haspopup="dialog"
                data-cart-target
                whileTap={{ scale: 0.92 }}
                className={cn(iconBtn, 'relative inline-flex items-center justify-center')}
              >
                <motion.span
                  key={`icon-${bump}`}
                  initial={bump ? { rotate: -14, scale: 1.15 } : false}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 10 }}
                  className="flex"
                >
                  <ShoppingCart className="h-5 w-5" />
                </motion.span>
                <AnimatePresence>
                  {mounted && count > 0 && (
                    <motion.span
                      key={`badge-${bump}`}
                      initial={{ scale: bump ? 0.3 : 0, y: bump ? -6 : 0 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 11 }}
                      className="absolute -end-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-deal px-1 font-mono text-[10px] font-bold leading-none text-deal-foreground shadow-glow-deal"
                    >
                      {count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <MobileSheet open={mobileOpen} onClose={closeMobile} isActive={isActive} />
      <MiniCart open={cartOpen} onClose={closeCart} />
    </MotionConfig>
  );
}
