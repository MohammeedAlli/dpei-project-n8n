'use client';

import * as React from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getProducts } from '@/data/api';
import type { ProductWithMeta } from '@/data/types';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  products?: ProductWithMeta[];
};

const STARTER_QUESTIONS_AR = [
  'عايز أردوينو للمبتدئين',
  'إيه أحسن حساس حرارة؟',
  'محتاج موتور سيرفو لمشروع',
  'في ESP32 متوفر؟',
];

const STARTER_QUESTIONS_EN = [
  'I need an Arduino for beginners',
  'What is the best temperature sensor?',
  'I need a servo motor for a project',
  'Is ESP32 available?',
];

export function FloatingChat() {
  const { lang } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: t('assistant', 'welcome', lang) }]);
    }
  }, [open, lang, messages.length]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    setInput('');
    setBusy(true);
    setMessages((m) => [...m, { role: 'user', content: text }]);

    try {
      const products = await getProducts({ search: text, sort: 'relevance', limit: 3 });
      let content: string;
      if (products.length === 0) {
        content = lang === 'ar'
          ? 'مقدرتش ألاقي مكونات مطابقة لبحثك. جرب كلمات تانية أو الـ SKU.'
          : "I couldn't find components matching your search. Try other keywords or a SKU.";
      } else {
        content = lang === 'ar'
          ? `لاقيت ${products.length} منتج ممكن ينفعك:`
          : `I found ${products.length} products that may suit you:`;
      }
      setMessages((m) => [...m, { role: 'assistant', content, products }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: t('assistant', 'unavailable', lang) }]);
    } finally {
      setBusy(false);
    }
  };

  const starters = lang === 'ar' ? STARTER_QUESTIONS_AR : STARTER_QUESTIONS_EN;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-110"
        aria-label={t('assistant', 'title', lang)}
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 end-6 z-50 flex h-[500px] max-h-[80vh] w-[380px] max-w-[calc(100vw-3rem)] flex-col rounded-xl border bg-card shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <span className="font-cairo text-sm font-bold">{t('assistant', 'title', lang)}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef as never}>
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                m.role === 'user' ? 'bg-muted' : 'bg-accent text-accent-foreground'
              }`}>
                {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div className={`max-w-[80%] rounded-lg p-2.5 text-xs ${
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {m.content}
                {m.products && m.products.length > 0 && (
                  <div className="mt-2 space-y-1.5 border-t border-border/40 pt-2">
                    {m.products.map((p) => (
                      <a
                        key={p.id}
                        href={`/products/${p.id}`}
                        className="block rounded border border-border/50 bg-card p-1.5 hover:border-accent"
                      >
                        <div className="font-medium">{lang === 'ar' ? p.name_ar : p.name_en}</div>
                        {p.lowest_price !== null && (
                          <div className="text-accent font-bold">{formatEGP(p.lowest_price, lang)}</div>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <Skeleton className="h-7 w-24" />
            </div>
          )}
          {/* Starter questions */}
          {messages.length <= 1 && !busy && (
            <div className="space-y-1.5 pt-2">
              <div className="text-xs text-muted-foreground">
                {lang === 'ar' ? 'أسئلة مقترحة:' : 'Suggested questions:'}
              </div>
              {starters.map((q, i) => (
                <button
                  key={i}
                  onClick={() => send(q)}
                  className="block w-full rounded-lg border border-border bg-card p-2 text-start text-xs hover:border-accent hover:bg-accent/5"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('assistant', 'placeholder', lang)}
            disabled={busy}
            className="h-9 text-sm"
          />
          <Button type="submit" size="icon" disabled={busy || !input.trim()} className="h-9 w-9 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
