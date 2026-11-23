'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { ChatText } from '@/components/chat-text';
import { SparkleAvatar } from '@/components/chat/sparkle-avatar';
import { TypingDots } from '@/components/chat/typing-dots';
import { ProductChatCard } from '@/components/chat/product-chat-card';
import { cn } from '@/lib/utils';
import type { ProductWithMeta } from '@/lib/catalog';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: ProductWithMeta[];
  /** assistant: still waiting for the reply */
  pending?: boolean;
  /** assistant: reveal text progressively (only for fresh replies) */
  stream?: boolean;
  /** user: attachment label */
  attachment?: string;
  /** id used to find the matching voice transcript */
  token?: string;
};

/** Progressive reveal. Word-based, capped to ~2.2 s total so long replies don't feel slow. Skipped on reduced motion. */
function useStreamed(text: string, enabled: boolean, onTick?: () => void) {
  const [n, setN] = React.useState(enabled ? 0 : text.length);
  const tick = React.useRef(onTick);
  tick.current = onTick;
  React.useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!enabled || reduce) {
      setN(text.length);
      return;
    }
    setN(0);
    const step = Math.max(2, Math.ceil(text.length / 70));
    const id = setInterval(() => {
      setN((c) => {
        const next = Math.min(text.length, c + step);
        if (next >= text.length) clearInterval(id);
        return next;
      });
      tick.current?.();
    }, 30);
    return () => clearInterval(id);
  }, [text, enabled]);
  return { shown: text.slice(0, n), done: n >= text.length };
}

export function MessageBubble({
  message,
  isLast,
  onRegenerate,
  onTick,
}: {
  message: ChatMessage;
  isLast: boolean;
  onRegenerate?: () => void;
  onTick?: () => void;
}) {
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';
  const { shown, done } = useStreamed(message.content, !!message.stream && !isUser && !message.pending, onTick);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  if (isUser) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex justify-end">
        <div className="max-w-[85%] rounded-lg rounded-ee-sm bg-brand-gradient px-4 py-2.5 text-sm text-primary-foreground shadow-1 sm:max-w-[75%]">
          {message.attachment && (
            <p className="mb-1 truncate text-xs opacity-80" dir="ltr">📎 {message.attachment}</p>
          )}
          {message.content && <ChatText text={message.content} />}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex items-start gap-2.5">
      <SparkleAvatar size="sm" className="mt-0.5" />
      <div className="min-w-0 max-w-[88%] space-y-3 sm:max-w-[80%]">
        <div className="glass rounded-lg rounded-ss-sm px-4 py-2.5 text-sm">
          {message.pending ? <TypingDots label={L('المساعد بيكتب', 'Assistant is typing')} /> : <ChatText text={shown} />}
          {!message.pending && !done && <span className="ms-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-accent" aria-hidden />}
        </div>

        {!message.pending && done && message.products && message.products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]"
          >
            {message.products.map((p) => (
              <ProductChatCard key={p.id} product={p} />
            ))}
          </motion.div>
        )}

        {!message.pending && done && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <button
              type="button"
              onClick={copy}
              className={cn('inline-flex h-7 items-center gap-1 rounded-sm px-2 text-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
              aria-label={L('نسخ الرد', 'Copy reply')}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? L('اتنسخ', 'Copied') : L('نسخ', 'Copy')}
            </button>
            {isLast && onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex h-7 items-center gap-1 rounded-sm px-2 text-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={L('إعادة توليد الرد', 'Regenerate reply')}
              >
                <RotateCcw className="h-3.5 w-3.5 rtl-flip" />
                {L('إعادة', 'Regenerate')}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
