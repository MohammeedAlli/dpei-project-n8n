import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Thrown for any auth failure; `status` is what the route should answer with. Messages are safe to show. */
export class AuthFail extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export type AdminCtx = { db: SupabaseClient; userId: string; email: string; ip: string | null };

function aalOf(token: string): string {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return String(JSON.parse(Buffer.from(payload, 'base64').toString('utf8')).aal ?? '');
  } catch {
    return '';
  }
}

export function clientIp(request: Request): string | null {
  return (
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || // Vercel: set by the platform
    request.headers.get('x-nf-client-connection-ip') || // Netlify: set by the platform
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null
  );
}

/**
 * Verifies the Bearer token with Supabase, checks profiles.role === 'admin', and (when ADMIN_REQUIRE_MFA=true)
 * that the session is aal2. Returns a service-role client for the route to use.
 * ADMIN_REQUIRE_MFA stays unset/false until every admin has enrolled TOTP, then set it to true in Netlify.
 */
export async function requireAdmin(request: Request): Promise<AdminCtx> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new AuthFail(500, 'السيرفر غير مهيأ');

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new AuthFail(401, 'غير مصرح');

  const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userData, error } = await db.auth.getUser(token);
  if (error || !userData.user) throw new AuthFail(401, 'غير مصرح');

  const { data: me } = await db.from('profiles').select('role').eq('id', userData.user.id).maybeSingle();
  if (me?.role !== 'admin') throw new AuthFail(403, 'غير مصرح');

  if (process.env.ADMIN_REQUIRE_MFA === 'true' && aalOf(token) !== 'aal2') {
    throw new AuthFail(403, 'مطلوب التحقق بخطوتين');
  }
  return { db, userId: userData.user.id, email: userData.user.email ?? '', ip: clientIp(request) };
}

/** Append-only audit entry. Never throws: a missing table must not break the admin action itself. */
export async function audit(ctx: AdminCtx, action: string, target: string | null, details?: Record<string, unknown>) {
  try {
    await ctx.db.from('admin_audit_log').insert({
      actor_id: ctx.userId,
      actor_email: ctx.email,
      action,
      target,
      details: details ?? null,
      ip: ctx.ip,
    });
  } catch {
    /* ignore */
  }
}
