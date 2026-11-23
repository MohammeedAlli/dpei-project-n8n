'use client';

import * as React from 'react';
import { KeyRound, Plus, ShieldCheck, ShieldOff, Shuffle, UserCheck, UserX, TriangleAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import { useLanguage } from '@/components/providers/language-provider';

type Adm = { id: string; email: string; last_sign_in_at: string | null; has_mfa: boolean; disabled: boolean; is_me: boolean };

export function AdminAdmins() {
  const supabase = React.useMemo(() => createBrowserSupabaseClient(), []);
  const { toast } = useToast();
  const { lang } = useLanguage();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [admins, setAdmins] = React.useState<Adm[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({ email: '', password: '' });

  const call = React.useCallback(
    async (method: 'GET' | 'POST', body?: Record<string, unknown>) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/admins', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          'x-ui-lang': lang,
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? L('تعذر تنفيذ الطلب', 'Request failed'));
      return json;
    },
    [supabase, lang]
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const j = await call('GET');
      setAdmins(j.admins ?? []);
    } catch (e) {
      toast({ title: L('تعذر تحميل الأدمنز', 'Could not load admins'), description: e instanceof Error ? e.message : '', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [call, toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const act = async (a: Adm, action: 'reset_mfa' | 'disable' | 'enable', confirmText?: string, okText = L('تم', 'Done')) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(a.id + action);
    try {
      await call('POST', { action, user_id: a.id });
      toast({ title: okText });
      await load();
    } catch (e) {
      toast({ title: L('تعذر التنفيذ', 'Action failed'), description: e instanceof Error ? e.message : '', variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const randomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint32Array(16);
    crypto.getRandomValues(bytes);
    setForm((f) => ({ ...f, password: Array.from(bytes, (b) => chars[b % chars.length]).join('') }));
  };

  const create = async () => {
    setBusy('create');
    try {
      await call('POST', { action: 'create', email: form.email, password: form.password });
      toast({ title: L('تم إنشاء الأدمن', 'Admin created'), description: L('هيسجّل تطبيق التحقق عند أول دخول.', 'They will set up their authenticator app at first login.') });
      setAdding(false);
      setForm({ email: '', password: '' });
      await load();
    } catch (e) {
      toast({ title: L('تعذر الإنشاء', 'Could not create admin'), description: e instanceof Error ? e.message : '', variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const active = admins.filter((a) => !a.disabled).length;

  return (
    <div className="container mx-auto space-y-4 px-4 py-8">
      <h1 className="text-xl font-bold">{L('الأدمنز', 'Admins')}</h1>
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-muted-foreground">
          {L(
            'كل أدمن بيدخل بإيميله وتطبيق التحقق بتاعه. لو تليفون أدمن راح، أدمن تاني يضغط «مسح 2FA» وهو يسجّل تطبيق جديد.',
            'Each admin signs in with their own email and authenticator app. If an admin loses their phone, another admin clicks “Reset 2FA” and they enrol a new app.'
          )}
        </p>
        <Button onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" />
          {L('إضافة أدمن', 'Add admin')}
        </Button>
      </Card>

      {!loading && active < 2 && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          {L('عندك أدمن واحد بس شغّال. لو ضاع تليفونه مش هتقدر تدخل. ضيف أدمن تاني.', 'You only have one active admin. If their phone is lost you will be locked out. Add a second admin.')}
        </p>
      )}

      {loading ? (
        <Skeleton className="h-40" />
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{L('الإيميل', 'Email')}</TableHead>
                <TableHead>{L('التحقق بخطوتين', 'Two-step verification')}</TableHead>
                <TableHead>{L('آخر دخول', 'Last sign-in')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div dir="ltr" className="font-semibold">
                      {a.email}
                    </div>
                    <div className="mt-1 flex gap-1">
                      {a.is_me && <Badge variant="secondary">{L('أنت', 'You')}</Badge>}
                      {a.disabled && <Badge variant="destructive">{L('معطّل', 'Disabled')}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {a.has_mfa ? (
                      <Badge variant="outline" className="gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        {L('مفعّل', 'Enabled')}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{L('لسه ما سجّلش', 'Not set up yet')}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {a.last_sign_in_at ? new Date(a.last_sign_in_at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB') : '—'}
                  </TableCell>
                  <TableCell>
                    {!a.is_me && (
                      <div className="flex flex-wrap gap-1">
                        {a.has_mfa && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy === a.id + 'reset_mfa'}
                            onClick={() =>
                              act(
                                a,
                                'reset_mfa',
                                L(`تمسح التحقق بخطوتين لـ ${a.email}؟ هيسجّل تطبيق جديد عند دخوله الجاي.`, `Reset two-step verification for ${a.email}? They will enrol a new app at next sign-in.`),
                                L('تم مسح التحقق بخطوتين', 'Two-step verification reset')
                              )
                            }
                          >
                            <ShieldOff className="h-4 w-4" />
                            {L('مسح 2FA', 'Reset 2FA')}
                          </Button>
                        )}
                        {a.disabled ? (
                          <Button size="sm" variant="outline" disabled={busy === a.id + 'enable'} onClick={() => act(a, 'enable', undefined, L('تم تفعيل الحساب', 'Account enabled'))}>
                            <UserCheck className="h-4 w-4" />
                            {L('تفعيل', 'Enable')}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy === a.id + 'disable'}
                            onClick={() => act(
                                a,
                                'disable',
                                L(`تعطّل حساب ${a.email}؟ مش هيقدر يسجّل دخول جديد.`, `Disable ${a.email}? They will not be able to sign in again.`),
                                L('تم تعطيل الحساب', 'Account disabled')
                              )}
                          >
                            <UserX className="h-4 w-4" />
                            {L('تعطيل', 'Disable')}
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{L('إضافة أدمن', 'Add admin')}</DialogTitle>
            <DialogDescription>
              {L('اكتب إيميله وكلمة مرور (12 حرف على الأقل) وابعتها له بطريقة آمنة. هيسجّل تطبيق التحقق عند أول دخول.', 'Enter their email and a password (at least 12 characters) and send it to them securely. They will set up the authenticator app at first sign-in.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{L('الإيميل', 'Email')}</Label>
              <Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{L('كلمة المرور', 'Password')}</Label>
              <div className="flex gap-2">
                <Input dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <Button type="button" variant="outline" onClick={randomPassword}>
                  <Shuffle className="h-4 w-4" />
                  {L('توليد', 'Generate')}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(false)}>
              {L('إلغاء', 'Cancel')}
            </Button>
            <Button onClick={create} disabled={busy === 'create'}>
              <KeyRound className="h-4 w-4" />
              {L('إنشاء', 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
