'use client';

import * as React from 'react';
import { Cpu, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { getSettings } from '@/data/api';
import { t } from '@/lib/i18n';
import type { Settings } from '@/data/types';

export function SiteFooter() {
  const { lang } = useLanguage();
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [currentYear, setCurrentYear] = React.useState<number | null>(null);

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  React.useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  const whatsapp = settings?.support_whatsapp ?? '201001234567';

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Cpu className="h-4 w-4" />
              </div>
              <span className="font-cairo text-base font-bold">
                {lang === 'ar' ? 'سوق الإلكترونيات' : 'Electronics Souk'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {lang === 'ar'
                ? 'قارن أسعار المكونات الإلكترونية من أحسن المحلات في مصر.'
                : 'Compare electronic component prices from the best shops in Egypt.'}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">
              {lang === 'ar' ? 'روابط سريعة' : 'Quick links'}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/products" className="hover:text-foreground">{t('nav', 'products', lang)}</a></li>
              <li><a href="/compare" className="hover:text-foreground">{t('nav', 'compare', lang)}</a></li>
              <li><a href="/track" className="hover:text-foreground">{t('nav', 'track', lang)}</a></li>
              <li><a href="/assistant" className="hover:text-foreground">{t('nav', 'assistant', lang)}</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">
              {lang === 'ar' ? 'الدعم' : 'Support'}
            </h3>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              {lang === 'ar' ? `واتساب: ${whatsapp}` : `WhatsApp: ${whatsapp}`}
            </a>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          © {currentYear ?? ''} {lang === 'ar' ? 'سوق الإلكترونيات' : 'Electronics Souk'}
        </div>
      </div>
    </footer>
  );
}
