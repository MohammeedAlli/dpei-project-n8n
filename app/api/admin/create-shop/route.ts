import { NextResponse } from 'next/server';
import { AuthFail, audit, requireAdmin } from '@/lib/server/admin-auth';

// بيشتغل على السيرفر بس. بيستخدم SUPABASE_SERVICE_ROLE_KEY (سري، مايتحطش في NEXT_PUBLIC_).
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

  // 2) البيانات
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail('بيانات غير صالحة', 400);
  }

  const name = String(body.name ?? '').trim();
  const slug = String(body.slug ?? '').trim().toLowerCase();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const commission = Number(body.commission_rate ?? 0);
  const deliveryFee = Number(body.delivery_fee ?? 0);
  const freeThreshold = Number(body.free_delivery_threshold ?? 0);
  const whatsapp = String(body.contact_whatsapp ?? '').trim() || null;
  const deliveryDays = String(body.delivery_days_text ?? '').trim() || null;

  if (name.length < 2) return fail('اسم المحل قصير', 400);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return fail('الاسم المختصر (slug) لازم يكون حروف إنجليزي صغيرة وأرقام وشرطات', 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('الإيميل غير صحيح', 400);
  if (password.length < 12) return fail('كلمة المرور لازم تكون 12 حرف على الأقل', 400);
  if (!Number.isFinite(commission) || commission < 0 || commission > 100) return fail('نسبة العمولة بين 0 و 100', 400);
  if (!Number.isFinite(deliveryFee) || !Number.isFinite(freeThreshold) || deliveryFee < 0 || freeThreshold < 0 || deliveryFee > 10000 || freeThreshold > 1000000) return fail('أرقام التوصيل غير صحيحة', 400);

  // 3) المحل
  const { data: shop, error: shopErr } = await admin
    .from('shops')
    .insert({
      name,
      slug,
      is_partner: true,
      commission_rate: commission,
      delivery_fee: deliveryFee,
      free_delivery_threshold: freeThreshold,
      delivery_days_text: deliveryDays,
      contact_whatsapp: whatsapp,
      is_active: true,
    })
    .select('id')
    .single();
  if (shopErr || !shop) {
    return fail(
      shopErr?.code === '23505' ? 'الاسم المختصر (slug) مستخدم قبل كده' : 'تعذر إنشاء المحل',
      400
    );
  }

  // 4) حساب الدخول
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    await admin.from('shops').delete().eq('id', shop.id);
    return fail('تعذر إنشاء الحساب (ممكن الإيميل مستخدم)', 400);
  }

  // 5) ربط الحساب بالمحل
  const { error: profileErr } = await admin
    .from('profiles')
    .insert({ id: created.user.id, role: 'shop', shop_id: shop.id });
  if (profileErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    await admin.from('shops').delete().eq('id', shop.id);
    return fail('تعذر ربط الحساب بالمحل', 500);
  }

  await audit(ctx, 'shop.create', shop.id, { name, slug, email, commission });
  return NextResponse.json({ ok: true, shop_id: shop.id });
}
