'use client';

import * as React from 'react';
import { Store, Save, X } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { formatEGP } from '@/lib/format';
import { t } from '@/lib/i18n';

type ShopRow = {
  id: string;
  name: string;
  slug: string;
  is_partner: boolean;
  commission_rate: number;
  delivery_fee: number;
  free_delivery_threshold: number;
  delivery_days_text: string | null;
  contact_whatsapp: string | null;
  external_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function AdminShops() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const [shops, setShops] = React.useState<ShopRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState<Partial<ShopRow>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('shops')
        .select('*')
        .order('is_partner', { ascending: false })
        .order('name', { ascending: true });
      setShops((data || []) as unknown as ShopRow[]);
      setLoading(false);
    })();
  }, []);

  const startEdit = (shop: ShopRow) => {
    setEditingId(shop.id);
    setEditForm({ ...shop });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const updates = {
      name: editForm.name,
      is_partner: editForm.is_partner,
      commission_rate: Number(editForm.commission_rate),
      delivery_fee: Number(editForm.delivery_fee),
      free_delivery_threshold: Number(editForm.free_delivery_threshold),
      delivery_days_text: editForm.delivery_days_text,
      contact_whatsapp: editForm.contact_whatsapp,
      external_url: editForm.external_url,
      is_active: editForm.is_active,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('shops').update(updates).eq('id', editingId);
    if (error) {
      toast({ title: t('common', 'error', lang), variant: 'destructive' });
    } else {
      toast({ title: t('admin', 'saved', lang) });
      setShops((prev) =>
        prev.map((s) => (s.id === editingId ? { ...s, ...updates } as ShopRow : s))
      );
      cancelEdit();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {shops.map((shop) => (
        <Card key={shop.id} className="p-4">
          {editingId === shop.id ? (
            /* Edit mode */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{t('admin', 'editShop', lang)}</h3>
                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">{t('admin', 'shopName', lang)}</Label>
                  <Input
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{t('admin', 'whatsapp', lang)}</Label>
                  <Input
                    value={editForm.contact_whatsapp || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, contact_whatsapp: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{t('admin', 'commissionRate', lang)} (%)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={((editForm.commission_rate || 0) * 100).toFixed(1)}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, commission_rate: Number(e.target.value) / 100 }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{t('admin', 'deliveryFee', lang)}</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={editForm.delivery_fee || 0}
                    onChange={(e) => setEditForm((p) => ({ ...p, delivery_fee: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{t('admin', 'freeDeliveryThreshold', lang)}</Label>
                  <Input
                    type="number"
                    step="10"
                    min="0"
                    value={editForm.free_delivery_threshold || 0}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, free_delivery_threshold: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{t('admin', 'deliveryDays', lang)}</Label>
                  <Input
                    value={editForm.delivery_days_text || ''}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, delivery_days_text: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs">{t('admin', 'externalUrl', lang)}</Label>
                  <Input
                    value={editForm.external_url || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, external_url: e.target.value }))}
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!editForm.is_partner}
                    onCheckedChange={(v) => setEditForm((p) => ({ ...p, is_partner: v }))}
                  />
                  <Label className="text-sm">{t('admin', 'isPartner', lang)}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!editForm.is_active}
                    onCheckedChange={(v) => setEditForm((p) => ({ ...p, is_active: v }))}
                  />
                  <Label className="text-sm">{t('admin', 'isActive', lang)}</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveEdit} disabled={saving}>
                  <Save className="h-4 w-4" />
                  {t('admin', 'save', lang)}
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
                  {t('admin', 'cancel', lang)}
                </Button>
              </div>
            </div>
          ) : (
            /* View mode */
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Store className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{shop.name}</span>
                    <Badge variant={shop.is_partner ? 'default' : 'secondary'} className="text-[10px]">
                      {shop.is_partner ? t('common', 'partner', lang) : t('common', 'nonPartner', lang)}
                    </Badge>
                    {!shop.is_active && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        {t('admin', 'inactive', lang)}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {shop.is_partner
                      ? `${(shop.commission_rate * 100).toFixed(0)}% · ${formatEGP(shop.delivery_fee, lang)} · ≥${formatEGP(shop.free_delivery_threshold, lang)}`
                      : (shop.contact_whatsapp || '—')}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => startEdit(shop)}>
                {t('admin', 'editShop', lang)}
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
