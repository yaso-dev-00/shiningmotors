import { NextResponse, type NextRequest } from 'next/server';

// Basic auth check using Supabase cookies (sb-access-token)
// Note: In Next.js 16, cookies in proxy are still accessed synchronously
// Only route handlers and server components use async cookies
function isAuthenticated(req: NextRequest): boolean {
  const access = req.cookies.get('sb-access-token')?.value;
  return Boolean(access);
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const protectedPaths: RegExp[] = [
    /^\/admin(\/.*)?$/,
    /^\/vendor(\/.*)?$/,
    /^\/vendor-dashboard$/,
    /^\/messenger(\/.*)?$/,
    /^\/myServiceBookings$/,
    /^\/profile(\/.*)?$/,
    /^\/settings$/,
  ];

  const requiresAuth = protectedPaths.some((re) => re.test(pathname));

  if (requiresAuth && !isAuthenticated(req)) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/vendor/:path*',
    '/vendor-dashboard',
    '/messenger/:path*',
    '/myServiceBookings',
    '/profile/:path*',
    '/settings',
  ],
};


