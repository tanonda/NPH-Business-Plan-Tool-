import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'vnh_bp_session';
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_PER_MINUTE || 120);
const buckets = new Map<string, { count: number; resetAt: number }>();

const PUBLIC_PATHS = new Set(['/login', '/favicon.ico']);

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/public/') ||
    Boolean(pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|map|txt|xml|json)$/))
  );
}

function isPublicApi(pathname: string) {
  return pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/logout');
}

function rateLimitKey(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'local';
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'same-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

function checkRateLimit(request: NextRequest) {
  const key = rateLimitKey(request);
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  current.count += 1;
  if (current.count > RATE_LIMIT_MAX) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const limited = pathname.startsWith('/api/') ? checkRateLimit(request) : null;
  if (limited) return applySecurityHeaders(limited);

  if (PUBLIC_PATHS.has(pathname) || isPublicAsset(pathname) || isPublicApi(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  if (pathname.startsWith('/api/')) {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionToken) return applySecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    return applySecurityHeaders(NextResponse.next());
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', `${pathname}${search}` || '/');
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  if (pathname === '/login' && sessionToken) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    return applySecurityHeaders(NextResponse.redirect(homeUrl));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
