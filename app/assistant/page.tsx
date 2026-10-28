'use client';

import * as React from 'react';
import { Sparkles, Send, User, Bot } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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

export default function AssistantPage() {
  const { lang } = useLanguage();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: t('assistant', 'welcome', lang),
      },
    ]);
  }, [lang]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput('');
    setBusy(true);
    const userMsg: Message = { role: 'user', content: trimmed };
    setMessages((m) => [...m, userMsg]);

    try {
      const products = await getProducts({ search: trimmed, sort: 'relevance', limit: 3 });
      let content: string;
      if (products.length === 0) {
        content =
          lang === 'ar'
            ? 'مقدرتش ألاقي مكونات مطابقة لبحثك. جرب كلمات تانية أو الـ SKU.'
            : "I couldn't find components matching your search. Try other keywords or a SKU.";
      } else {
        content =
          lang === 'ar'
            ? `لاقيت ${products.length} منتج ممكن ينفعك:`
            : `I found ${products.length} products that may suit you:`;
      }
      setMessages((m) => [...m, { role: 'assistant', content, products }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: t('assistant', 'unavailable', lang) },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const starters = lang === 'ar' ? STARTER_QUESTIONS_AR : STARTER_QUESTIONS_EN;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-cairo text-2xl font-bold">{t('assistant', 'title', lang)}</h1>
            <p className="text-sm text-muted-foreground">
              {lang === 'ar' ? 'مساعد ذكي بيبحث في الكتالوج' : 'Smart assistant that searches the catalog'}
            </p>
          </div>
        </div>

        <Card className="flex h-[60vh] flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollRef as never}>
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      m.role === 'user' ? 'bg-muted' : 'bg-accent text-accent-foreground'
                    }`}
                  >
                    {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-lg p-3 text-sm ${
                      m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    {m.content}
                    {m.products && m.products.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
                        {m.products.map((p) => (
                          <a
                            key={p.id}
                            href={`/products/${p.id}`}
                            className="block rounded-lg border border-border/50 bg-card p-2 hover:border-accent"
                          >
                            <div className="text-xs font-medium">
                              {lang === 'ar' ? p.name_ar : p.name_en}
                            </div>
                            {p.lowest_price !== null && (
                              <div className="mt-0.5 text-xs font-bold text-accent">
                                {formatEGP(p.lowest_price, lang)}
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-muted p-3">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </div>
              )}

              {/* Starter questions */}
              {messages.length <= 1 && !busy && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    {lang === 'ar' ? 'أسئلة مقترحة:' : 'Suggested questions:'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {starters.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => send(q)}
                        className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-accent hover:bg-accent/5"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-3">
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
              />
              <Button type="submit" size="icon" disabled={busy || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
