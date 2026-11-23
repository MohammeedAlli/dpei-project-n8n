import { NextResponse } from 'next/server';
import { AuthFail, audit, requireAdmin } from '@/lib/server/admin-auth';

// Manage admin accounts: list, create, reset 2FA, disable / enable. Admin only (and aal2 when ADMIN_REQUIRE_MFA=true).
export const dynamic = 'force-dynamic';

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });
// the dashboard sends its language in x-ui-lang so errors read in the language on screen
const t = (request: Request, ar: string, en: string) => (request.headers.get('x-ui-lang') === 'en' ? en : ar);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  let ctx;
  try {
    ctx = await requireAdmin(request);
  } catch (e) {
    if (e instanceof AuthFail) return fail(e.message, e.status);
    return fail(t(request, 'غير مصرح', 'Not authorized'), 401);
  }
  const { data: profs, error } = await ctx.db.from('profiles').select('id').eq('role', 'admin');
  if (error) return fail(t(request, 'تعذر تحميل الأدمنز', 'Could not load admins'), 500);

  const admins = await Promise.all(
    (profs ?? []).map(async (p: { id: string }) => {
      const { data } = await ctx.db.auth.admin.getUserById(p.id);
      const u = data?.user;
      const f = await ctx.db.auth.admin.mfa.listFactors({ userId: p.id });
      const hasMfa = (f.data?.factors ?? []).some((x: { status?: string }) => x.status === 'verified');
      const disabled = !!u?.banned_until && new Date(u.banned_until) > new Date();
      return {
        id: p.id,
        email: u?.email ?? '',
        last_sign_in_at: u?.last_sign_in_at ?? null,
        has_mfa: hasMfa,
        disabled,
        is_me: p.id === ctx.userId,
      };
    })
  );
  admins.sort((a, b) => a.email.localeCompare(b.email));
  return NextResponse.json({ admins });
}

export async function POST(request: Request) {
  let ctx;
  try {
    ctx = await requireAdmin(request);
  } catch (e) {
    if (e instanceof AuthFail) return fail(e.message, e.status);
    return fail(t(request, 'غير مصرح', 'Not authorized'), 401);
  }
  const admin = ctx.db;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail(t(request, 'بيانات غير صالحة', 'Invalid data'), 400);
  }
  const action = String(body.action ?? '');

  // ---- create a new admin
  if (action === 'create') {
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(t(request, 'الإيميل غير صحيح', 'Invalid email'), 400);
    if (password.length < 12) return fail(t(request, 'كلمة المرور لازم تكون 12 حرف على الأقل', 'Password must be at least 12 characters'), 400);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (createErr || !created.user) return fail(t(request, 'تعذر إنشاء الحساب (ممكن الإيميل مستخدم)', 'Could not create the account (the email may already be in use)'), 400);

    const { error: profileErr } = await admin.from('profiles').insert({ id: created.user.id, role: 'admin' });
    if (profileErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      return fail(t(request, 'تعذر إنشاء صلاحية الأدمن', 'Could not grant admin access'), 500);
    }
    await audit(ctx, 'admin.create', created.user.id, { email });
    return NextResponse.json({ ok: true });
  }

  // ---- actions on an existing admin
  const userId = String(body.user_id ?? '');
  if (!UUID_RE.test(userId)) return fail(t(request, 'الحساب غير محدد', 'No account selected'), 400);
  if (userId === ctx.userId) return fail(t(request, 'مينفعش تعمل ده على حسابك أنت. اطلب من أدمن تاني.', 'You cannot do this to your own account. Ask another admin.'), 400);

  const { data: target } = await admin.from('profiles').select('id').eq('id', userId).eq('role', 'admin').maybeSingle();
  if (!target) return fail(t(request, 'الحساب ده مش أدمن', 'That account is not an admin'), 404);

  if (action === 'reset_mfa') {
    const { data, error } = await admin.auth.admin.mfa.listFactors({ userId });
    if (error) return fail(t(request, 'تعذر قراءة بيانات التحقق', 'Could not read verification data'), 400);
    let removed = 0;
    for (const f of data?.factors ?? []) {
      const { error: delErr } = await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId });
      if (delErr) return fail(t(request, 'تعذر الحذف', 'Could not remove it'), 400);
      removed++;
    }
    await audit(ctx, 'admin.mfa_reset', userId, { removed });
    return NextResponse.json({ ok: true, removed });
  }

  if (action === 'disable' || action === 'enable') {
    const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: action === 'disable' ? '876000h' : 'none' });
    if (error) return fail(t(request, 'تعذر تغيير حالة الحساب', 'Could not change the account status'), 400);
    await audit(ctx, action === 'disable' ? 'admin.disable' : 'admin.enable', userId);
    return NextResponse.json({ ok: true });
  }

  return fail(t(request, 'إجراء غير معروف', 'Unknown action'), 400);
}
