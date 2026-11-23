import { NextResponse } from 'next/server';
import { AuthFail, audit, requireAdmin } from '@/lib/server/admin-auth';

// Save as app/api/admin/shop-mfa-reset/route.ts
// Removes the TOTP factor(s) of a shop's login so the owner enrols a new phone at the next login.
export const dynamic = 'force-dynamic';

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  let ctx;
  try {
    ctx = await requireAdmin(request);
  } catch (e) {
    if (e instanceof AuthFail) return fail(e.message, e.status);
    return fail('غير مصرح', 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail('بيانات غير صالحة', 400);
  }
  const shopId = String(body.shop_id ?? '');
  if (!shopId) return fail('المحل غير محدد', 400);

  const { data: profile } = await ctx.db.from('profiles').select('id').eq('role', 'shop').eq('shop_id', shopId).limit(1).maybeSingle();
  if (!profile) return fail('المحل ملوش حساب دخول', 404);

  const { data, error } = await ctx.db.auth.admin.mfa.listFactors({ userId: profile.id });
  if (error) return fail('تعذر قراءة بيانات التحقق', 400);

  let removed = 0;
  for (const f of data?.factors ?? []) {
    const { error: delErr } = await ctx.db.auth.admin.mfa.deleteFactor({ id: f.id, userId: profile.id });
    if (delErr) return fail('تعذر الحذف', 400);
    removed++;
  }
  await audit(ctx, 'shop.mfa_reset', shopId, { removed });
  return NextResponse.json({ ok: true, removed });
}
