import { getProduct } from '@/data/api';
import type { Language } from '@/lib/types';
import type { ProductWithMeta } from '@/data/types';

// بيكلّم /api/chat (اللي بدوره بيكلّم n8n من السيرفر).
// بيرجّع: رد الشات + كروت المنتجات + نص الرسالة الصوتية (لو فيه).

const SESSION_KEY = 'souk-chat-session';
const SESSION_RE = /^[a-zA-Z0-9_-]{8,64}$/;
const TIMEOUT_MS = 60_000;

export type AssistantResult = {
  reply: string;
  products: ProductWithMeta[];
  transcript: string;
};

// معرّف ثابت لكل متصفح، عشان n8n يفتكر المحادثة (Simple Memory)
function getSessionId(): string {
  try {
    const saved = window.localStorage.getItem(SESSION_KEY);
    if (saved && SESSION_RE.test(saved)) return saved;
  } catch {
    // ignore
  }
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  try {
    window.localStorage.setItem(SESSION_KEY, id);
  } catch {
    // ignore
  }
  return id;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

export async function askAssistant(
  message: string,
  lang: Language,
  file?: File
): Promise<AssistantResult> {
  const sessionId = getSessionId();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let init: RequestInit;
    if (file) {
      const form = new FormData();
      form.append('message', message);
      form.append('session_id', sessionId);
      form.append('lang', lang);
      form.append('file', file, file.name || 'upload');
      init = { method: 'POST', body: form };
    } else {
      init = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, session_id: sessionId, lang }),
      };
    }

    const res = await fetch('/api/chat', { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`chat_${res.status}`);

    const data = (await res.json()) as {
      reply?: string;
      product_ids?: string[];
      transcript?: string;
    };

    const ids = Array.from(new Set(Array.isArray(data.product_ids) ? data.product_ids : []));
    // product cards are a bonus: a slow or failing lookup must never block the text reply
    const found = await Promise.all(ids.map((id) => withTimeout(getProduct(id), 8000).catch(() => null)));
    const products = found.filter((p): p is ProductWithMeta => !!p);

    return {
      reply: String(data.reply ?? '').trim(),
      products,
      transcript: String(data.transcript ?? '').trim(),
    };
  } finally {
    clearTimeout(timer);
  }
}