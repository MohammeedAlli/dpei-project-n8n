'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Cpu,
  ShoppingCart,
  Moon,
  Sun,
  Languages,
  Search,
  Menu,
  PackageSearch,
  Scale,
  Sparkles,
  Truck,
  LayoutDashboard,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'home', href: '/', icon: Cpu },
  { key: 'products', href: '/products', icon: PackageSearch },
  { key: 'compare', href: '/compare', icon: Scale },
  { key: 'assistant', href: '/assistant', icon: Sparkles },
  { key: 'track', href: '/track', icon: Truck },
] as const;

export function SiteHeader() {
  const { lang, toggle } = useLanguage();
  const { count } = useCart();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchFocused, setSearchFocused] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const cartLabel = lang === 'ar' ? 'السلة' : 'Cart';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center gap-3 px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side={lang === 'ar' ? 'right' : 'left'} className="w-72">
            <SheetHeader>
              <SheetTitle className="font-cairo">
                {lang === 'ar' ? 'سوق الإلكترونيات' : 'Electronics Souk'}
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive(item.href) && 'bg-accent text-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {t('nav', item.key, lang)}
                </Link>
              ))}
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <LayoutDashboard className="h-4 w-4" />
                {t('nav', 'admin', lang)}
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Cpu className="h-5 w-5" />
          </div>
          <span className="hidden font-cairo text-lg font-bold tracking-tight sm:inline-block">
            {lang === 'ar' ? 'سوق الإلكترونيات' : 'Electronics Souk'}
          </span>
        </Link>

        <nav className="ms-4 hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive(item.href) && 'bg-accent text-accent-foreground'
              )}
            >
              {t('nav', item.key, lang)}
            </Link>
          ))}
        </nav>

        {/* Search - expands on focus */}
        <div className={cn(
          'relative hidden transition-all duration-300 lg:block',
          searchFocused ? 'ms-auto w-64 max-w-xs flex-1' : 'ms-auto w-36 max-w-[9rem] flex-1'
        )}>
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
          <form
            action="/products"
            className="w-full"
          >
            <Input
              name="q"
              placeholder={t('nav', 'search', lang)}
              className="h-9 ps-9"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </form>
        </div>

        <div className="flex items-center gap-1 lg:ms-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={t('nav', 'language', lang)}
            title={t('nav', 'language', lang)}
          >
            <Languages className="h-4 w-4" />
            <span className="sr-only">{t('nav', 'language', lang)}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={t('nav', 'toggleTheme', lang)}
          >
            {mounted && theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Link href="/cart" className="relative" aria-label={cartLabel}>
            <Button variant="ghost" size="icon" className="relative" aria-label={cartLabel}>
              <ShoppingCart className="h-5 w-5" />
              {mounted && count > 0 && (
                <Badge
                  className="absolute -top-1 -end-1 h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground"
                >
                  {count}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile search row */}
      <div className="border-t px-4 py-2 lg:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
          <form action="/products" className="w-full">
            <Input
              name="q"
              placeholder={t('nav', 'search', lang)}
              className="h-9 ps-9"
            />
          </form>
        </div>
      </div>
    </header>
  );
}
