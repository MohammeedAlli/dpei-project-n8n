'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Package, Truck, Search, ArrowRight, ArrowLeft, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getSettings } from '@/data/api';
import type { Settings } from '@/data/types';

function ConfirmationContent() {
  const { lang, dir } = useLanguage();
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '';
  const total = searchParams.get('total') || '0';
  const shipments = searchParams.get('shipments') || '1';
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const [settings, setSettings] = React.useState<Settings | null>(null);

  React.useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  const whatsapp = settings?.support_whatsapp ?? '201001234567';

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-lg">
        {/* Success icon */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="font-cairo text-2xl font-bold">{t('order', 'success', lang)}</h1>
        </div>

        <Card className="p-6 space-y-5">
          {/* Order code */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground">{t('order', 'code', lang)}</div>
            <div className="font-cairo text-2xl font-bold text-accent">{code}</div>
          </div>

          <Separator />

          {/* Summary */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('order', 'total', lang)}</span>
              <span className="font-bold">{formatEGP(Number(total), lang)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>
                {shipments} {lang === 'ar' ? 'شحنة منفصلة' : 'separate shipments'}
              </span>
            </div>
          </div>

          <Separator />

          {/* Multi-shipment explanation */}
          <div className="rounded-lg bg-accent/5 p-4 text-sm">
            <div className="mb-1 flex items-center gap-2 font-medium">
              <Package className="h-4 w-4 text-accent" />
              {lang === 'ar' ? 'شحنات مستقلة' : 'Independent shipments'}
            </div>
            <p className="text-muted-foreground">{t('checkout', 'multiShipmentNote', lang)}</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link href={`/track?code=${code}`} className="block">
              <Button className="w-full" size="lg">
                <Search className="h-4 w-4" />
                {t('order', 'track', lang)}
                <Arrow className="h-4 w-4" />
              </Button>
            </Link>

            {/* Support */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span>{t('order', 'support', lang)}:</span>
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-600 hover:underline"
              >
                {whatsapp}
              </a>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
            {t('cart', 'continueShopping', lang)}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <React.Suspense fallback={<div className="container mx-auto px-4 py-16" />}>
      <ConfirmationContent />
    </React.Suspense>
  );
}
