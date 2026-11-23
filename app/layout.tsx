import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Inter, IBM_Plex_Sans_Arabic, JetBrains_Mono, Cairo } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { LanguageProvider } from '@/components/providers/language-provider';
import { CartProvider } from '@/components/providers/cart-provider';
import { AdminProvider } from '@/components/providers/admin-provider';
import { MotionProvider } from '@/components/providers/motion-provider';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { FloatingChat } from '@/components/floating-chat';
import { BackToTop } from '@/components/back-to-top';
import { CookieNotice } from '@/components/legal/cookie-notice';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const SHOW_DEV_BANNER = false;

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const arabic = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '500', '600', '700'], variable: '--font-arabic', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
// legacy: only so existing `font-cairo` classes keep working
const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo', display: 'swap' });

export const metadata: Metadata = {
  title: 'Electro Hub',
  description: 'قارن أسعار المكونات الإلكترونية من المحلات المصرية. Compare prices of electronic components from Egyptian shops.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1220' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable} ${arabic.variable} ${mono.variable} ${cairo.variable} antialiased`}>
        <ThemeProvider>
          <LanguageProvider>
            <MotionProvider>
              <CartProvider>
                <AdminProvider>
                  {/* bilingual skip link: visible only on keyboard focus */}
                  <a href="#main" className="skip-link">تخطي إلى المحتوى · Skip to content</a>
                  <div className="relative flex min-h-screen flex-col">
                    {SHOW_DEV_BANNER && <div className="dev-banner">بيانات تجريبية — Mock data for development</div>}
                    <SiteHeader />
                    <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
                    <SiteFooter />
                  </div>
                  <TooltipProvider delayDuration={150}>
                    <FloatingChat />
                  </TooltipProvider>
                  <BackToTop />
                  <CookieNotice />
                  <Toaster />
                </AdminProvider>
              </CartProvider>
            </MotionProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
