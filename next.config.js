/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseHost = '';
try {
  supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : '';
} catch {
  /* ignore */
}

// Content-Security-Policy.
// Next.js injects small inline scripts, so script-src keeps 'unsafe-inline' (a nonce-based policy needs middleware and
// makes every page dynamic; see README). Everything else is locked down to your own origin + Supabase.
// Set CSP_REPORT_ONLY=true in Netlify to log violations in the browser console WITHOUT blocking anything.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${supabaseHost ? ` https://${supabaseHost} wss://${supabaseHost}` : ' https:'}${isProd ? '' : ' ws: http://localhost:*'}`,
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: process.env.CSP_REPORT_ONLY === 'true' ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy', value: csp },
  // HTTPS only for 1 year. No "preload" on purpose: preload is very hard to undo; add it later once you are sure.
  ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : []),
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // microphone stays allowed for your own pages (voice input in the assistant); everything else off
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // kept as in your original: images are served as-is (no Next optimizer).
    // While this is true, AVIF/WebP below have NO effect. To enable them, remove `unoptimized`
    // (works on Vercel / Netlify's Next runtime) and test your external image hosts.
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  experimental: {
    // smaller bundles for big icon / animation packages
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  compress: true,
  poweredByHeader: false,
  async rewrites() {
    return [{ source: '/.well-known/security.txt', destination: '/api/security-txt' }];
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // keep admin and login pages out of search engines
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/login', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};

module.exports = nextConfig;
