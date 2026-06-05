import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis if env vars are present
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = (redisUrl && redisToken)
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Safeguard: pass through if Redis is not configured
  if (!redis) {
    return NextResponse.next();
  }

  // Skip static assets, api routes, favicon, home page
  if (
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Extract short code (e.g., /xY7z2 -> xY7z2)
  const code = pathname.substring(1);

  // Validate code format (length of 5)
  if (code && code.length === 5) {
    try {
      const originalUrl = await redis.get(`url:${code}`);
      
      if (originalUrl) {
        // Increment clicks
        await redis.incr(`clicks:${code}`);
        return NextResponse.redirect(new URL(originalUrl), 302);
      }
    } catch (error) {
      console.error('Middleware redirect error:', error);
    }
  }

  // Fallback: If code is not found, continue to next.js routing (renders 404 page)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
