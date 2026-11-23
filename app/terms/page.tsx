import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { TERMS } from '@/lib/legal-content';

export const metadata: Metadata = { title: 'الشروط والأحكام | Terms of Use' };

export default function TermsPage() {
  return <LegalPage title={{ ar: 'الشروط والأحكام', en: 'Terms of Use' }} sections={TERMS} other={{ href: '/privacy', label: { ar: 'سياسة الخصوصية', en: 'Privacy Policy' } }} />;
}
