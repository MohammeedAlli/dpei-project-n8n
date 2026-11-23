'use client';

import * as React from 'react';
import Link from 'next/link';
import { Mail, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { LEGAL } from '@/lib/legal';
import { useSupportContact, prettyPhone } from '@/lib/contact';
import { formatDate } from '@/lib/format';
import type { Section } from '@/lib/legal-content';

function fill(s: string, lang: 'ar' | 'en') {
  return s.replace('{brand}', lang === 'ar' ? LEGAL.brandAr : LEGAL.brandEn).replace('{months}', String(LEGAL.retentionMonths));
}

export function LegalPage({ title, sections, other }: { title: { ar: string; en: string }; sections: Section[]; other: { href: string; label: { ar: string; en: string } } }) {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const contact = useSupportContact();
  const email = contact.email || LEGAL.email;

  return (
    <div className="container px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-bold">{title[lang]}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {L('آخر تحديث: ', 'Last updated: ')}
          {formatDate(LEGAL.updated, lang)}
        </p>

        <nav aria-label={L('محتويات الصفحة', 'On this page')} className="mt-6 flex flex-wrap gap-2">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-accent">
              {s.title[lang]}
            </a>
          ))}
        </nav>

        <div className="mt-8 space-y-8">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="mb-3 text-xl font-semibold">{s.title[lang]}</h2>
              <div className="space-y-2 leading-relaxed text-foreground/90">
                {s.body[lang].map((p, i) =>
                  p.startsWith('• ') ? (
                    <p key={i} className="ps-4 -indent-4">
                      <span className="me-1.5 text-accent">•</span>
                      {fill(p.slice(2), lang)}
                    </p>
                  ) : (
                    <p key={i}>{fill(p, lang)}</p>
                  )
                )}
              </div>
            </section>
          ))}

          <section id="contact" className="scroll-mt-24 rounded-lg border border-border bg-card p-5">
            <h2 className="mb-3 text-xl font-semibold">{L('تواصل معانا', 'Contact us')}</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              {L('لطلبات الخصوصية أو للإبلاغ عن مشكلة أو محتوى مشبوه:', 'For privacy requests, to report a problem or a suspicious page:')}
            </p>
            <ul className="space-y-2 text-sm">
              {email && (
                <li>
                  <a className="inline-flex items-center gap-2 hover:text-accent" href={`mailto:${email}`}>
                    <Mail className="h-4 w-4" />
                    <bdi dir="ltr">{email}</bdi>
                  </a>
                </li>
              )}
              {contact.whatsapp && (
                <li>
                  <a className="inline-flex items-center gap-2 hover:text-accent" href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    <bdi dir="ltr">{prettyPhone(contact.whatsapp)}</bdi>
                  </a>
                </li>
              )}
              {!email && !contact.whatsapp && contact.loaded && (
                <li>
                  <Link className="hover:text-accent" href="/assistant">{L('اسأل المساعد الذكي', 'Ask the AI Assistant')}</Link>
                </li>
              )}
            </ul>
          </section>

          <p className="text-sm">
            <Link href={other.href} className="text-accent underline-offset-4 hover:underline">
              {other.label[lang]}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
