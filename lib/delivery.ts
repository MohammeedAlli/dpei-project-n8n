'use client';

import * as React from 'react';
import { getActiveShops } from '@/data/api';

export type DeliveryRule = { fee: number; threshold: number };

// بيجيب رسوم التوصيل وحد التوصيل المجاني الحقيقيين لكل محل من الداتابيز
// (نفس الأرقام اللي دالة create_order بتحسب بيها الطلب فعلاً).
export function useDeliveryRules() {
  const [rules, setRules] = React.useState<Record<string, DeliveryRule>>({});
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    getActiveShops()
      .then((shops) => {
        if (!alive) return;
        const map: Record<string, DeliveryRule> = {};
        for (const s of shops) {
          map[s.id] = {
            fee: Number(s.delivery_fee ?? 0),
            threshold: Number(s.free_delivery_threshold ?? 0),
          };
        }
        setRules(map);
      })
      .catch(() => {})
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  // نفس منطق الداتابيز: لو إجمالي المحل >= حد التوصيل المجاني، التوصيل بـ 0
  const ruleFor = React.useCallback(
    (shopId: string): DeliveryRule => rules[shopId] ?? { fee: 0, threshold: 0 },
    [rules]
  );

  const deliveryFor = React.useCallback(
    (shopId: string, subtotal: number): number => {
      const r = ruleFor(shopId);
      return subtotal >= r.threshold ? 0 : r.fee;
    },
    [ruleFor]
  );

  return { ruleFor, deliveryFor, loaded };
}
