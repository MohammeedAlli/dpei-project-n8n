'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, PackageSearch, Sparkles } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  return (
    <div className="bg-pcb container flex min-h-[70dvh] flex-col items-center justify-center gap-6 py-16 text-center">
      {/* an unplugged chip with a broken trace */}
      <svg viewBox="0 0 320 180" className="h-44 w-auto text-foreground/80" aria-hidden fill="none">
        <path d="M0 90 H92" className="stroke-accent" strokeWidth="3" strokeLinecap="round" />
        <path d="M228 90 H320" className="stroke-accent" strokeWidth="3" strokeLinecap="round" />
        <motion.path
          d="M92 90 l14 -10 l10 22 l12 -26"
          className="stroke-destructive"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ opacity: [1, 0.2, 1, 0.5, 1] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
        <rect x="116" y="48" width="88" height="84" rx="10" className="fill-accent/15 stroke-current" strokeWidth="3" />
        <path d="M134 48v-14M160 48v-14M186 48v-14M134 132v14M160 132v14M186 132v14" className="stroke-current" strokeWidth="3" strokeLinecap="round" />
        <text x="160" y="104" textAnchor="middle" className="fill-current font-mono" fontSize="34" fontWeight="700">404</text>
        <circle cx="92" cy="90" r="5" className="fill-background stroke-accent" strokeWidth="3" />
        <circle cx="228" cy="90" r="5" className="fill-background stroke-accent" strokeWidth="3" />
      </svg>
      <div>
        <h1 className="font-display text-3xl font-bold md:text-4xl">{L('الصفحة دي مش موجودة', "This page isn't here")}</h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          {L('يمكن الرابط اتغيّر أو المنتج اتشال. جرّب ترجع للرئيسية أو دوّر على اللي محتاجه.', 'The link may have changed or the product was removed. Head back home or search for what you need.')}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild><Link href="/"><Home className="h-4 w-4" />{L('الرئيسية', 'Home')}</Link></Button>
        <Button asChild variant="outline"><Link href="/products"><PackageSearch className="h-4 w-4" />{L('تصفح المنتجات', 'Browse products')}</Link></Button>
        <Button asChild variant="ghost"><Link href="/assistant"><Sparkles className="h-4 w-4" />{L('اسأل المساعد', 'Ask the assistant')}</Link></Button>
      </div>
    </div>
  );
}
