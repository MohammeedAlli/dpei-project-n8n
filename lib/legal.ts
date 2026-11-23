/** Facts used by the Privacy / Terms pages. Review them: they are statements about YOUR business. */
export const LEGAL = {
  brandAr: 'Electro Hub',
  brandEn: 'Electro Hub',
  /** orders older than this are anonymised (see supabase/sec_06_privacy_tools.sql) */
  retentionMonths: 24,
  updated: '2026-11-15',
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '',
};
