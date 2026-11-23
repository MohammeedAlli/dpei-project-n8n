'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchProfile } from '@/lib/auth/profile';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';

const WRONG_PASSWORD_ERROR = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
const UNAUTHORIZED_ERROR = 'هذا الحساب غير مصرح له بالدخول';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const profile = await fetchProfile(supabase, user.id);
      if (profile?.role === 'admin') router.replace('/admin');
      else if (profile?.role === 'shop') router.replace('/shop');
    })();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createBrowserSupabaseClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user) {
      setError(WRONG_PASSWORD_ERROR);
      setSubmitting(false);
      return;
    }

    const profile = await fetchProfile(supabase, data.user.id);
    if (profile?.role === 'admin') {
      window.location.assign('/admin');
      return;
    }
    if (profile?.role === 'shop') {
      window.location.assign('/shop');
      return;
    }

    await supabase.auth.signOut();
    setError(UNAUTHORIZED_ERROR);
    setSubmitting(false);
  };

  return (
    <div className="container mx-auto px-4 py-16" dir="rtl" lang="ar">
      <div className="mx-auto max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-7 w-7" />
          </div>
          <h1 className="font-cairo text-xl font-bold">تسجيل الدخول</h1>
          <p className="mt-1 text-sm text-muted-foreground">للأدمن وأصحاب المحلات فقط</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ps-9"
                  required
                  autoComplete="email"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ps-9"
                  required
                  autoComplete="current-password"
                  dir="ltr"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'جاري الدخول...' : 'دخول'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
