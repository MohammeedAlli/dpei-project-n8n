import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { PRIVACY } from '@/lib/legal-content';

export const metadata: Metadata = { title: 'سياسة الخصوصية | Privacy Policy' };

export default function PrivacyPage() {
  return <LegalPage title={{ ar: 'سياسة الخصوصية', en: 'Privacy Policy' }} sections={PRIVACY} other={{ href: '/terms', label: { ar: 'الشروط والأحكام', en: 'Terms of Use' } }} />;
}
