'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Banknote, BellRing, Check, Cpu, Globe, Loader2, Mail, MessageCircle, Moon, Sun } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Reveal } from '@/components/reveal';
import { CategoryArt, categoryKey } from '@/components/category-art';
import { getActiveShops } from '@/data/api';
import { supabase } from '@/lib/supabase';
import { getCategories } from '@/lib/catalog';
import { prettyPhone, useSupportContact } from '@/lib/contact';
import { t } from '@/lib/i18n';
import type { Category, Shop } from '@/lib/types';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const linkCls = 'inline-block py-1 text-sm text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm';

function Newsletter({ lang }: { lang: 'ar' | 'en' }) {
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [email, setEmail] = React.useState('');
  const [state, setState] = React.useState<'idle' | 'busy' | 'ok' | 'dup' | 'err' | 'unavailable'>('idle');
  const valid = EMAIL_RE.test(email.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || state === 'busy') return;
    setState('busy');
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim().toLowerCase(), lang });
    if (!error) setState('ok');
    else if (error.code === '23505') setState('dup');
    else if (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message)) setState('unavailable');
    else setState('err');
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <label htmlFor="nl-email" className="flex items-center gap-2 text-sm font-semibold text-white">
        <BellRing className="h-4 w-4 text-electric" />
        {L('نبّهني لما الأسعار تنزل', 'Get price-drop alerts')}
      </label>
      <div className="flex gap-2">
        <input
          id="nl-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state !== 'busy') setState('idle');
          }}
          placeholder="you@email.com"
          className="h-11 min-w-0 flex-1 rounded-md border border-white/15 bg-white/5 px-3 text-start text-sm text-white placeholder:text-slate-400 focus-visible:border-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
        />
        <button
          type="submit"
          disabled={!valid || state === 'busy' || state === 'ok'}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-md bg-brand-gradient px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric disabled:opacity-50"
        >
          {state === 'busy' ? <Loader2 className="h-4 w-4 animate-spin" /> : state === 'ok' ? <Check className="h-4 w-4" /> : null}
          {state === 'ok' ? L('تم', 'Done') : L('اشترك', 'Subscribe')}
        </button>
      </div>
      <p role="status" className={`min-h-[1.1rem] text-xs ${state === 'err' || state === 'unavailable' ? 'text-red-300' : state === 'ok' ? 'text-emerald-300' : 'text-slate-400'}`}>
        {state === 'ok' && L('تمام! هنبعتلك لما أسعار تنزل.', "You're in! We'll email you about price drops.")}
        {state === 'dup' && L('الإيميل ده مشترك بالفعل.', 'This email is already subscribed.')}
        {state === 'err' && L('حصلت مشكلة، جرّب تاني.', 'Something went wrong, please try again.')}
        {state === 'unavailable' && L('الاشتراك مش متاح لسه.', 'Subscriptions are not available yet.')}
        {state === 'idle' && L('بدون رسائل مزعجة. تقدر تلغي في أي وقت.', 'No spam. Unsubscribe any time.')}
      </p>
    </form>
  );
}

export function SiteFooter() {
  const { lang, toggle } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const contact = useSupportContact();
  const [shops, setShops] = React.useState<Shop[]>([]);
  const [cats, setCats] = React.useState<Category[]>([]);
  const [mounted, setMounted] = React.useState(false);
  const [year, setYear] = React.useState<number | null>(null);

  React.useEffect(() => {
    setMounted(true);
    setYear(new Date().getFullYear());
    getActiveShops().then(setShops).catch(() => {});
    getCategories().then((c) => setCats(c.slice(0, 6))).catch(() => {});
  }, []);

  const dark = mounted && resolvedTheme === 'dark';
  const partners = shops.filter((s) => s.is_partner).slice(0, 10);
  const brand = 'Electro Hub';

  return (
    <footer className="relative overflow-hidden text-slate-300 [background-color:#0b1220]">
      {/* subtle circuit pattern */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]">
        <defs>
          <pattern id="footer-circuit" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M0 60h30l10-10h40l10 10h30M60 0v30l10 10v40l-10 10v30" fill="none" stroke="#22d3ee" strokeWidth="1" />
            <circle cx="40" cy="50" r="2.5" fill="#22d3ee" />
            <circle cx="80" cy="50" r="2.5" fill="#22d3ee" />
            <circle cx="70" cy="40" r="2.5" fill="#22d3ee" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#footer-circuit)" />
      </svg>
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric/60 to-transparent" />

      <div className="container relative py-12">
        {/* partner shops strip */}
        {partners.length > 0 && (
          <Reveal className="mb-10 border-b border-white/10 pb-8">
            <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-slate-400">{L('محلات شريكة بنقارن أسعارها', 'Partner shops we compare')}</p>
            <ul className="flex flex-wrap items-center justify-center gap-3">
              {partners.map((s) => (
                <li key={s.id} className="flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white/90" title={s.name}>
                  {s.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logo_url} alt="" loading="lazy" decoding="async" className="h-6 w-6 rounded-sm bg-white object-contain p-0.5" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-white/10 text-[11px] font-bold">{s.name.slice(0, 1)}</span>
                  )}
                  <span className="max-w-[8rem] truncate">{s.name}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-4 sm:col-span-2 lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-gradient text-primary-foreground shadow-glow"><Cpu className="h-5 w-5" /></span>
              <span className="font-display text-lg font-bold text-white">{brand}</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-slate-400">
              {L('قارن أسعار المكونات الإلكترونية من أحسن المحلات في مصر، واشتري من أرخص محل في دقيقة.', 'Compare electronic component prices from the best shops in Egypt and buy from the cheapest in a minute.')}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
              <Banknote className="h-4 w-4" />
              {L('الدفع عند الاستلام', 'Cash on delivery')}
            </div>
            <Newsletter lang={lang} />
          </div>

          <nav aria-label={L('روابط سريعة', 'Quick links')} className="lg:col-span-2">
            <h2 className="mb-3 text-sm font-semibold text-white">{L('روابط سريعة', 'Quick links')}</h2>
            <ul>
              <li><Link href="/products" className={linkCls}>{t('nav', 'products', lang)}</Link></li>
              <li><Link href="/compare" className={linkCls}>{t('nav', 'compare', lang)}</Link></li>
              <li><Link href="/track" className={linkCls}>{t('nav', 'track', lang)}</Link></li>
              <li><Link href="/assistant" className={linkCls}>{t('nav', 'assistant', lang)}</Link></li>
              <li><Link href="/cart" className={linkCls}>{t('nav', 'cart', lang)}</Link></li>
            </ul>
          </nav>

          <nav aria-label={L('الأقسام', 'Categories')} className="lg:col-span-3">
            <h2 className="mb-3 text-sm font-semibold text-white">{L('الأقسام', 'Categories')}</h2>
            <ul>
              {cats.map((c) => (
                <li key={c.id}>
                  <Link href={`/products?category=${c.id}`} className={`${linkCls} inline-flex items-center gap-2`}>
                    <CategoryArt kind={categoryKey(c)} className="h-4 w-4 text-electric" />
                    {lang === 'ar' ? c.name_ar : c.name_en}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h2 className="mb-3 text-sm font-semibold text-white">{L('الدعم', 'Support')}</h2>
            <ul className="space-y-1">
              {contact.whatsapp && (
                <li>
                  <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className={`${linkCls} inline-flex items-center gap-2`}>
                    <MessageCircle className="h-4 w-4 text-emerald-400" />
                    {L('واتساب: ', 'WhatsApp: ')}
                    <bdi dir="ltr">{prettyPhone(contact.whatsapp)}</bdi>
                  </a>
                </li>
              )}
              {contact.email && (
                <li>
                  <a href={`mailto:${contact.email}`} className={`${linkCls} inline-flex items-center gap-2`}>
                    <Mail className="h-4 w-4 text-electric" />
                    <bdi dir="ltr">{contact.email}</bdi>
                  </a>
                </li>
              )}
              {contact.loaded && !contact.whatsapp && !contact.email && (
                <li className="text-sm text-slate-400">
                  <Link href="/assistant" className={linkCls}>{L('اسأل المساعد الذكي', 'Ask the AI Assistant')}</Link>
                </li>
              )}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={toggle} className="inline-flex h-10 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric" aria-label={L('Switch to English', 'التبديل إلى العربية')}>
                <Globe className="h-4 w-4" />
                {lang === 'ar' ? 'English' : 'العربية'}
              </button>
              <button type="button" onClick={() => setTheme(dark ? 'light' : 'dark')} className="inline-flex h-10 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric" aria-label={t('nav', 'toggleTheme', lang)}>
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {dark ? L('فاتح', 'Light') : L('داكن', 'Dark')}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row">
          <p>© {year ?? ''} {brand}</p>
          <nav aria-label={L('روابط قانونية', 'Legal')} className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/privacy" className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{L('سياسة الخصوصية', 'Privacy Policy')}</Link>
            <Link href="/terms" className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{L('الشروط والأحكام', 'Terms of Use')}</Link>
            <Link href="/privacy#contact" className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{L('إبلاغ عن مشكلة', 'Report a problem')}</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
