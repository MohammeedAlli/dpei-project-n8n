import './globals.css';
import type { Metadata } from 'next';
import { Cairo, Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { LanguageProvider } from '@/components/providers/language-provider';
import { CartProvider } from '@/components/providers/cart-provider';
import { AdminProvider } from '@/components/providers/admin-provider';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { FloatingChat } from '@/components/floating-chat';
import { Toaster } from '@/components/ui/toaster';

const SHOW_DEV_BANNER = false;

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'سوق الإلكترونيات | Electronics Souk',
  description:
    'قارن أسعار المكونات الإلكترونية من المحلات المصرية. Compare prices of electronic components from Egyptian shops.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} ${inter.variable} font-cairo antialiased`}>
        <ThemeProvider>
          <LanguageProvider>
            <CartProvider>
              <AdminProvider>
                <div className="relative flex min-h-screen flex-col">
                  {SHOW_DEV_BANNER && (
                    <div className="dev-banner">
                      بيانات تجريبية — Mock data for development
                    </div>
                  )}
                  <SiteHeader />
                  <main className="flex-1">{children}</main>
                  <SiteFooter />
                </div>
                <FloatingChat />
                <Toaster />
              </AdminProvider>
            </CartProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
