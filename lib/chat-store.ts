import * as React from 'react';
import type { ChatMessage } from '@/components/chat/message-bubble';
import type { ChatSendPayload } from '@/components/chat/assistant-composer';
import { askAssistant } from '@/lib/chat';
import { resetAssistantSession } from '@/lib/chat-session';
import { getProducts, type ProductWithMeta } from '@/lib/catalog';
import { t } from '@/lib/i18n';
import type { Language } from '@/lib/types';

/**
 * One conversation shared by every ChatPanel (the floating popup and /assistant).
 * It lives outside React, so it survives switching between them, and a reply that arrives
 * while you are moving between them is still delivered. Kept in sessionStorage so a refresh keeps it too.
 */
type State = { messages: ChatMessage[]; busy: boolean };

const KEY = 'souk-chat-messages-v1';
const EMPTY: State = { messages: [], busy: false };
let state: State = EMPTY;
let hydrated = false;
let lastReq: { payload: ChatSendPayload; lang: Language } | null = null;
const listeners = new Set<() => void>();

const uid = () => `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function save() {
  try {
    const keep = state.messages.filter((m) => !m.pending).map(({ stream: _s, ...m }) => m);
    window.sessionStorage.setItem(KEY, JSON.stringify(keep.slice(-60)));
  } catch {
    /* ignore */
  }
}

function set(next: Partial<State>) {
  state = { ...state, ...next };
  save();
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr) && arr.length && state.messages.length === 0) {
      state = { ...state, messages: arr as ChatMessage[] };
      listeners.forEach((l) => l());
    }
  } catch {
    /* ignore */
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useChat(): State {
  React.useEffect(() => {
    hydrate();
  }, []);
  return React.useSyncExternalStore(subscribe, () => state, () => EMPTY);
}

async function catalogFallback(q: string, lang: Language): Promise<{ reply: string; products: ProductWithMeta[] }> {
  try {
    const found = q ? await getProducts({ search: q, limit: 4 }) : [];
    if (found.length) {
      return {
        reply:
          lang === 'ar'
            ? 'المساعد مش متاح دلوقتي، بس دي نتايج من الكتالوج:'
            : 'The assistant is unavailable, but here are matches from the catalogue:',
        products: found.slice(0, 4),
      };
    }
  } catch {
    /* fall through */
  }
  return { reply: t('assistant', 'unavailable', lang), products: [] };
}

function dropLastAssistant(m: ChatMessage[]) {
  const i = [...m].reverse().findIndex((x) => x.role === 'assistant');
  return i < 0 ? m : m.filter((_, idx) => idx !== m.length - 1 - i);
}

export async function sendChat(payload: ChatSendPayload, lang: Language, opts: { regenerate?: boolean } = {}) {
  if (state.busy) return;
  const { text, file, kind } = payload;
  lastReq = { payload, lang };
  const token = uid();
  const pendingId = uid();
  const base = opts.regenerate
    ? dropLastAssistant(state.messages)
    : [
        ...state.messages,
        {
          id: token,
          role: 'user' as const,
          content: text || (kind === 'voice' ? (lang === 'ar' ? '🎤 رسالة صوتية…' : '🎤 Voice message…') : ''),
          attachment: kind === 'file' && file ? file.name : undefined,
          token: kind === 'voice' ? token : undefined,
        },
      ];
  set({ busy: true, messages: [...base, { id: pendingId, role: 'assistant', content: '', pending: true }] });

  let reply = '';
  let products: ProductWithMeta[] = [];
  try {
    const r = await askAssistant(text, lang, file);
    reply = r.reply || t('assistant', 'unavailable', lang);
    products = r.products;
    if (r.transcript && kind === 'voice') {
      set({ messages: state.messages.map((x) => (x.token === token ? { ...x, content: `🎤 ${r.transcript}` } : x)) });
    }
  } catch {
    const fb = await catalogFallback(text, lang);
    reply = fb.reply;
    products = fb.products;
  }
  // the chat may have been reset while waiting: only fill the placeholder if it still exists
  if (!state.messages.some((x) => x.id === pendingId)) {
    set({ busy: false });
    return;
  }
  set({
    busy: false,
    messages: state.messages.map((x) => (x.id === pendingId ? { ...x, pending: false, stream: true, content: reply, products } : x)),
  });
  // the typing effect is for a fresh reply only; a panel opened later shows the text straight away
  setTimeout(() => {
    set({ messages: state.messages.map((x) => (x.id === pendingId ? { ...x, stream: false } : x)) });
  }, 4000);
}

export function regenerateChat(lang: Language) {
  if (lastReq) void sendChat(lastReq.payload, lang, { regenerate: true });
}

export function resetChat() {
  if (state.busy) return;
  resetAssistantSession();
  lastReq = null;
  set({ messages: [] });
}
