import { AdminAuditLog } from '@/components/admin/admin-audit-log';

export default function AuditPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">سجل إجراءات الأدمن</h1>
      <AdminAuditLog />
    </div>
  );
}
