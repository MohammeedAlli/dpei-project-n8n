import { NextResponse } from 'next/server';

// Served at /.well-known/security.txt (see the rewrite in next.config.js). RFC 9116.
// Needs NEXT_PUBLIC_SUPPORT_EMAIL; without it the file does not exist (404) instead of publishing a fake contact.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return new NextResponse('Not found', { status: 404 });
  const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const body = [
    `Contact: mailto:${email}`,
    `Expires: ${expires}`,
    'Preferred-Languages: ar, en',
    `Canonical: ${origin}/.well-known/security.txt`,
    `Policy: ${origin}/privacy`,
    '',
  ].join('\n');
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } });
}
