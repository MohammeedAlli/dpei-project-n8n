import { NextResponse, type NextRequest } from 'next/server';
import { fetchProfile } from '@/lib/auth/profile';
import { updateSession } from '@/utils/supabase/middleware';

function loginRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { supabase, user, response } = await updateSession(request);
  const pathname = request.nextUrl.pathname;
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');
  const isShopPath = pathname === '/shop' || pathname.startsWith('/shop/');

  if (!isAdminPath && !isShopPath) {
    return response;
  }

  if (!user) {
    return loginRedirect(request);
  }

  const profile = await fetchProfile(supabase, user.id);

  if (isAdminPath && profile?.role !== 'admin') {
    return loginRedirect(request);
  }

  if (isShopPath && profile?.role !== 'shop') {
    return loginRedirect(request);
  }

  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/shop', '/shop/:path*'],
};
