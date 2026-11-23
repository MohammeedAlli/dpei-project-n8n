import { NextResponse } from 'next/server';
import { AuthFail, audit, requireAdmin } from '@/lib/server/admin-auth';

// إنشاء حساب دخول لمحل موجود، أو تغيير كلمة مرور حسابه.
// بيشتغل على السيرفر بس، وبيستخدم SUPABASE_SERVICE_ROLE_KEY (سري).
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
  const admin = ctx.db;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail('بيانات غير صالحة', 400);
  }

  const shopId = String(body.shop_id ?? '');
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (!shopId) return fail('المحل غير محدد', 400);
  if (password.length < 12) return fail('كلمة المرور لازم تكون 12 حرف على الأقل', 400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('الإيميل غير صحيح', 400);

  const { data: shop } = await admin.from('shops').select('id').eq('id', shopId).maybeSingle();
  if (!shop) return fail('المحل غير موجود', 404);

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'shop')
    .eq('shop_id', shopId)
    .limit(1)
    .maybeSingle();

  // المحل عنده حساب: نغيّر كلمة المرور (والإيميل لو اتكتب)
  if (existing) {
    const patch: { password: string; email?: string; email_confirm?: boolean } = { password };
    if (email) {
      patch.email = email;
      patch.email_confirm = true;
    }
    const { error } = await admin.auth.admin.updateUserById(existing.id, patch);
    if (error) return fail('تعذر تحديث الحساب', 400);
    await audit(ctx, 'shop.password_reset', shopId, { email_changed: !!email });
    return NextResponse.json({ ok: true, created: false });
  }

  // المحل ملوش حساب: ننشئ واحد
  if (!email) return fail('اكتب إيميل الدخول', 400);

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    return fail('تعذر إنشاء الحساب (ممكن الإيميل مستخدم)', 400);
  }

  const { error: profileErr } = await admin
    .from('profiles')
    .insert({ id: created.user.id, role: 'shop', shop_id: shopId });
  if (profileErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return fail('تعذر ربط الحساب بالمحل', 500);
  }

  await audit(ctx, 'shop.account_create', shopId, { email });
  return NextResponse.json({ ok: true, created: true });
}
