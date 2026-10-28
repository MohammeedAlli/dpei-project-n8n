'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Lock, Mail } from 'lucide-react';
import { useAdmin } from '@/components/providers/admin-provider';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t } from '@/lib/i18n';

export default function AdminLoginPage() {
  const { lang } = useLanguage();
  const { signIn, user, loading } = useAdmin();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!loading && user?.isAdmin) {
      router.replace('/admin/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    if (error) {
      setError(error.includes('Invalid') ? t('admin', 'invalidCredentials', lang) : error);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-16" />;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-7 w-7" />
          </div>
          <h1 className="font-cairo text-xl font-bold">{t('admin', 'login', lang)}</h1>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('admin', 'email', lang)}</Label>
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
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('admin', 'password', lang)}</Label>
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
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? t('admin', 'signingIn', lang) : t('admin', 'signIn', lang)}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
