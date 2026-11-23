// ---- app/layout.tsx : replace the font imports + body className only ----
import { Space_Grotesk, Inter, IBM_Plex_Sans_Arabic, JetBrains_Mono, Cairo } from 'next/font/google';

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
});
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
// Kept only so existing `font-cairo` classes keep working; remove once nothing uses it.
const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo', display: 'swap' });

// <body className={`${display.variable} ${sans.variable} ${arabic.variable} ${mono.variable} ${cairo.variable} antialiased`}>
// (drop `font-cairo` from <body>: globals.css now picks the font per html[lang])
