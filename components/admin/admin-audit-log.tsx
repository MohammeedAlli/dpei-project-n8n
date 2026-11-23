'use client';

import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';

type Entry = {
  id: number;
  at: string;
  actor_email: string | null;
  action: string;
  target: string | null;
  details: Record<string, unknown> | null;
  ip: string | null;
};

const LABELS: Record<string, string> = {
  'shop.create': 'إنشاء محل',
  'shop.account_create': 'إنشاء حساب محل',
  'shop.password_reset': 'تغيير كلمة مرور محل',
  'order.confirm': 'تأكيد طلب مشكوك فيه',
  'shop.mfa_reset': 'إعادة ضبط التحقق بخطوتين لمحل',
  'admin.create': 'إضافة أدمن',
  'admin.mfa_reset': 'مسح التحقق بخطوتين لأدمن',
  'admin.disable': 'تعطيل أدمن',
  'admin.enable': 'تفعيل أدمن',
};

export function AdminAuditLog() {
  const supabase = React.useMemo(() => createBrowserSupabaseClient(), []);
  const [rows, setRows] = React.useState<Entry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [q, setQ] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('admin_audit_log')
      .select('id, at, actor_email, action, target, details, ip')
      .order('at', { ascending: false })
      .limit(200);
    setError(err ? 'تعذر تحميل السجل' : null);
    setRows((data ?? []) as Entry[]);
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    load();
  }, [load]);

  const shown = rows.filter((r) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [r.action, LABELS[r.action], r.actor_email, r.target].some((v) => (v ?? '').toLowerCase().includes(s));
  });

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Input className="max-w-xs" placeholder="بحث: إيميل، إجراء، هدف" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
        <span className="text-xs text-muted-foreground">آخر 200 إجراء. السجل للقراءة فقط ومبيتعدّلش ولا بيتمسح.</span>
      </Card>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading ? (
        <Skeleton className="h-48" />
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الوقت</TableHead>
                <TableHead>الأدمن</TableHead>
                <TableHead>الإجراء</TableHead>
                <TableHead>الهدف</TableHead>
                <TableHead>تفاصيل</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    مفيش إجراءات.
                  </TableCell>
                </TableRow>
              )}
              {shown.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs">{new Date(r.at).toLocaleString('ar-EG')}</TableCell>
                  <TableCell dir="ltr" className="text-xs">{r.actor_email ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{LABELS[r.action] ?? r.action}</Badge>
                  </TableCell>
                  <TableCell dir="ltr" className="max-w-[160px] truncate text-xs">{r.target ?? '—'}</TableCell>
                  <TableCell dir="ltr" className="max-w-[260px] truncate text-xs text-muted-foreground">
                    {r.details ? JSON.stringify(r.details) : '—'}
                  </TableCell>
                  <TableCell dir="ltr" className="text-xs">{r.ip ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
