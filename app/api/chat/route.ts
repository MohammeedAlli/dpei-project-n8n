import { NextResponse } from 'next/server';
import { detectType, sanitizeImage } from '@/lib/server/upload-sanitize';

// Website chat → n8n. The n8n URL and secret stay on the server.
// Accepts a text message, a message with a file (image / PDF), or a voice message.
export const dynamic = 'force-dynamic';

const MAX_MESSAGE_LENGTH = 600;
const MAX_FILE_BYTES = 4 * 1024 * 1024; // hosting platforms usually cap bodies around 4.5 MB
const MAX_BODY_BYTES = MAX_FILE_BYTES + 256 * 1024; // file + form fields
const MAX_REPLY_CHARS = 4000;
const MAX_PER_MINUTE = 12; // only used by the in-memory fallback; the database limiter has its own numbers
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SESSION_RE = /^[a-zA-Z0-9_-]{8,64}$/;

// Fallback limiter (per server instance). Used only when the shared database limiter is unreachable.
const hits = new Map<string, number[]>();
function tooManyLocal(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_MINUTE;
}

const NO_STORE = { 'Cache-Control': 'no-store' };
// the n8n agent can take 10-15 s (the route waits up to 50 s); Vercel's default limit is shorter
export const maxDuration = 60;

const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: NO_STORE });

/**
 * The platform's own header comes first: Vercel sets x-vercel-forwarded-for and Netlify sets x-nf-client-connection-ip
 * itself (a client cannot fake them on that platform). x-forwarded-for can be influenced by the client, so it is last.
 */
function clientIp(request: Request): string {
  return (
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-nf-client-connection-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

/** Shared limiter (Supabase function chat_allow, service role only). Returns 'ok' | 'minute' | 'day' | 'file' | null (unreachable). */
async function sharedLimit(ip: string, hasFile: boolean): Promise<string | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${base}/rest/v1/rpc/chat_allow`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_ip: ip, p_has_file: hasFile }),
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const v = await res.json();
    return typeof v === 'string' ? v : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Never let a reply carry credentials or webhook secrets, even if the model was tricked into printing them. */
function cleanReply(text: string): string {
  return text
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[removed]') // JWTs (Supabase keys)
    .replace(/\b(sk|pk|rk)_[A-Za-z0-9_-]{16,}\b/g, '[removed]')
    .replace(/x-webhook-secret\s*[:=]\s*\S+/gi, '[removed]')
    .replace(/https?:\/\/[^\s]*\.app\.n8n\.cloud[^\s]*/gi, '[removed]')
    .slice(0, MAX_REPLY_CHARS)
    .trim();
}

export async function POST(request: Request) {
  const url = process.env.N8N_CHAT_WEBHOOK_URL;
  const secret = process.env.N8N_CHAT_SECRET;
  if (!url) return fail('not_configured', 503);
  // fail closed: without the shared secret the n8n webhook would be reachable by anyone
  if (!secret && process.env.NODE_ENV === 'production') return fail('not_configured', 503);

  // reject oversized bodies before reading them
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) return fail('file_too_large', 413);

  const ip = clientIp(request);
  const contentType = request.headers.get('content-type') ?? '';
  const isMultipart = contentType.includes('multipart/form-data');

  // 1) read the request (plain JSON or multipart with a file)
  let message = '';
  let sessionId = '';
  let lang: 'ar' | 'en' = 'ar';
  let file: File | null = null;
  try {
    if (isMultipart) {
      const form = await request.formData();
      message = String(form.get('message') ?? '');
      sessionId = String(form.get('session_id') ?? '');
      lang = form.get('lang') === 'en' ? 'en' : 'ar';
      const f = form.get('file');
      if (f && typeof f !== 'string') file = f as File;
    } else {
      const body = (await request.json()) as Record<string, unknown>;
      message = String(body.message ?? '');
      sessionId = String(body.session_id ?? '');
      lang = body.lang === 'en' ? 'en' : 'ar';
    }
  } catch {
    return fail('bad_request', 400);
  }

  // 2) rate limit (shared across all server instances; falls back to per-instance memory)
  const verdict = await sharedLimit(ip, !!file);
  if (verdict === null ? tooManyLocal(ip) : verdict !== 'ok') return fail('rate_limited', 429);

  // strip control characters, then cap the length
  message = message.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!SESSION_RE.test(sessionId)) return fail('bad_session', 400);
  if (!message && !file) return fail('empty_message', 400);

  // 3) check the file by its CONTENT, not by what the browser claims
  let upload: { blob: Blob; name: string } | null = null;
  if (file) {
    if (file.size === 0 || file.size > MAX_FILE_BYTES) return fail('file_too_large', 413);
    let bytes = new Uint8Array(await file.arrayBuffer());
    const detected = detectType(bytes);
    if (!detected) return fail('unsupported_file', 415);
    if (detected.kind === 'image') {
      const clean = sanitizeImage(bytes, detected.mime); // removes EXIF / GPS / XMP / comments
      if (!clean) return fail('unsupported_file', 415);
      bytes = clean;
    }
    const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    upload = { blob: new Blob([bytes as unknown as BlobPart], { type: detected.mime }), name: `upload-${rand}.${detected.ext}` }; // the user's file name never leaves this server
  }

  // 4) forward to n8n
  const headers: Record<string, string> = secret ? { 'x-webhook-secret': secret } : {};
  let init: RequestInit;
  if (upload) {
    const out = new FormData();
    out.append('message', message);
    out.append('session_id', sessionId);
    out.append('lang', lang);
    out.append('source', 'website');
    out.append('file', upload.blob, upload.name);
    init = { method: 'POST', headers, body: out };
  } else {
    init = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ message, session_id: sessionId, lang, source: 'website' }),
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 50_000);

  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
    if (!res.ok) return fail('upstream_error', 502);

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { reply: text };
    }
    // n8n sometimes returns an array with one item
    if (Array.isArray(data)) data = data[0];

    const obj = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
    const reply = cleanReply(String(obj.reply ?? obj.output ?? obj.text ?? ''));
    const rawIds = Array.isArray(obj.product_ids) ? obj.product_ids : [];
    const productIds = rawIds
      .map((x) => String(x))
      .filter((x) => UUID_RE.test(x))
      .slice(0, 4);
    const transcript = cleanReply(String(obj.transcript ?? '')).slice(0, MAX_MESSAGE_LENGTH);

    if (!reply) return fail('empty_reply', 502);
    return NextResponse.json({ reply, product_ids: productIds, transcript }, { headers: NO_STORE });
  } catch {
    return fail('upstream_unreachable', 502);
  } finally {
    clearTimeout(timer);
  }
}
