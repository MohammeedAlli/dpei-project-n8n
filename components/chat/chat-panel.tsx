'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Cpu, Plus, Thermometer, Cog, Wifi, Sparkles } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { AssistantComposer } from '@/components/chat/assistant-composer';
import { MessageBubble } from '@/components/chat/message-bubble';
import { SparkleAvatar } from '@/components/chat/sparkle-avatar';
import { useChat, sendChat, regenerateChat, resetChat } from '@/lib/chat-store';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const STARTERS = [
  { icon: Cpu, ar: 'محتاج أردوينو للمبتدئين', en: 'I need an Arduino for beginners' },
  { icon: Thermometer, ar: 'إيه أفضل حساس حرارة؟', en: 'What is the best temperature sensor?' },
  { icon: Cog, ar: 'محتاج سيرفو موتور لمشروع', en: 'I need a servo motor for a project' },
  { icon: Wifi, ar: 'هل ESP32 متوفر؟', en: 'Is ESP32 available?' },
];

/**
 * The whole conversation: messages, suggestions, composer, regenerate, new chat.
 * Used full-height on /assistant and in a small popup by FloatingChat (`compact`).
 */
export function ChatPanel({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const { messages, busy } = useChat();
  const scroller = React.useRef<HTMLDivElement>(null);

  const toBottom = React.useCallback((smooth = true) => {
    const el = scroller.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !reduce ? 'smooth' : 'auto' });
  }, []);
  React.useEffect(() => {
    toBottom();
  }, [messages.length, busy, toBottom]);

  const regenerate = () => regenerateChat(lang);
  const newChat = () => {
    if (busy) return;
    resetChat();
  };

  const empty = messages.length === 0;
  const Title = compact ? 'h2' : 'h1';
  const lastAssistantIdx = messages.map((m) => m.role).lastIndexOf('assistant');

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      {/* header */}
      <div className={cn('flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-primary/15 via-electric/10 to-transparent', compact ? 'px-3 py-2.5' : 'px-4 py-3.5 sm:px-6')}>
        <SparkleAvatar size={compact ? 'md' : 'lg'} />
        <div className="min-w-0 flex-1">
          <Title className={cn('font-display font-bold leading-tight', compact ? 'text-sm' : 'text-lg')}>
            {t('assistant', 'title', lang)}
          </Title>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {L('متصل · بيقارن أسعار 10 محلات', 'Online · compares prices across shops')}
          </p>
        </div>
        <button
          type="button"
          onClick={newChat}
          disabled={busy || empty}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 text-xs font-medium transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          {L('محادثة جديدة', 'New chat')}
        </button>
      </div>

      {/* messages */}
      <div ref={scroller} role="log" aria-live="polite" aria-label={t('assistant', 'title', lang)} className={cn('min-h-0 flex-1 overflow-y-auto', compact ? 'px-3 py-3' : 'px-4 py-5 sm:px-6')}>
        {empty && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex max-w-xl flex-col items-center gap-4 py-6 text-center">
            <SparkleAvatar size="lg" className="h-16 w-16" />
            <p className="max-w-sm text-sm text-muted-foreground">{t('assistant', 'welcome', lang)}</p>
          </motion.div>
        )}
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((m, i) => (
            <MessageBubble key={m.id} message={m} isLast={i === lastAssistantIdx && !busy} onRegenerate={regenerate} onTick={() => toBottom(false)} />
          ))}
        </div>
      </div>

      {/* suggestions: gone after the first message */}
      <AnimatePresence initial={false}>
        {empty && (
          <motion.div
            exit={{ opacity: 0, height: 0 }}
            className={cn('mx-auto flex w-full max-w-3xl gap-2 overflow-x-auto pb-2 [scrollbar-width:none]', compact ? 'px-3' : 'px-4 sm:flex-wrap sm:justify-center sm:px-6')}
          >
            {STARTERS.map(({ icon: Icon, ar, en }, i) => (
              <motion.button
                key={en}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i }}
                onClick={() => void sendChat({ text: lang === 'ar' ? ar : en }, lang)}
                disabled={busy}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-2 text-sm transition-colors hover:border-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="h-4 w-4 text-accent" />
                {lang === 'ar' ? ar : en}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn('mx-auto w-full max-w-3xl', compact ? 'p-3 pt-1' : 'px-4 pb-4 pt-1 sm:px-6')}>
        <AssistantComposer busy={busy} lang={lang} compact={compact} placeholder={t('assistant', 'placeholder', lang)} onSend={(p) => void sendChat(p, lang)} />
        {!compact && (
          <p className="mt-2 flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            {L('المساعد ممكن يغلط — راجع السعر في صفحة المنتج قبل الشراء.', 'The assistant can make mistakes — confirm the price on the product page before buying.')}
          </p>
        )}
      </div>
    </div>
  );
}
