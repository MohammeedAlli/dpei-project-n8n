import { FlaggedOrders } from '@/components/admin/flagged-orders';

export default function FlaggedPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">طلبات محتاجة تأكيد</h1>
      <FlaggedOrders />
    </div>
  );
}
