import { categoryKey, type CategoryKey } from '@/components/category-art';
import type { ProductWithMeta } from '@/lib/catalog';

const BREADBOARD = /breadboard|bread board|بريد ?بورد|لوحة تجارب/i;
const JUMPER = /jumper|dupont|wire|سلك|اسلاك|أسلاك|وصلات/i;

const WANTS: Partial<Record<CategoryKey, RegExp[]>> = {
  boards: [BREADBOARD, JUMPER, /usb.*cable|كابل.*usb/i],
  raspberry: [/sd ?card|micro ?sd|كارت/i, /adapter|power supply|شاحن|تغذية/i, /case|heat ?sink|كيس/i],
  sensors: [BREADBOARD, JUMPER, /arduino|esp/i],
  passive: [BREADBOARD, JUMPER, /led|ليد/i],
  leds: [/resistor|مقاوم/i, BREADBOARD, JUMPER],
  motors: [/driver|l298|l293|درايفر/i, /batter|بطار/i, /arduino|esp/i],
  relays: [/arduino|esp/i, JUMPER],
};

/** "Frequently bought together": cheapest matching catalogue item per complementary keyword (max 2). */
export function findComplements(product: ProductWithMeta, catalogue: ProductWithMeta[], max = 2) {
  const wants = WANTS[categoryKey(product.category)] ?? [BREADBOARD, JUMPER];
  const picked: ProductWithMeta[] = [];
  for (const re of wants) {
    const hit = catalogue
      .filter(
        (p) =>
          p.id !== product.id &&
          p.lowest_price !== null &&
          !picked.some((x) => x.id === p.id) &&
          re.test(`${p.name_en} ${p.name_ar}`)
      )
      .sort((a, b) => (a.lowest_price ?? 0) - (b.lowest_price ?? 0))[0];
    if (hit) picked.push(hit);
    if (picked.length >= max) break;
  }
  return picked;
}
