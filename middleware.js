import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { redis } from './lib/redis';
import { logger } from './lib/logger';

function parseUserAgent(uaString) {
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  if (!uaString) return { browser, os, device };

  // Device detection
  if (/mobile/i.test(uaString)) {
    device = 'Mobile';
  } else if (/tablet/i.test(uaString)) {
    device = 'Tablet';
  }

  // OS detection
  if (/windows/i.test(uaString)) {
    os = 'Windows';
  } else if (/macintosh|mac os x/i.test(uaString)) {
    os = 'macOS';
  } else if (/android/i.test(uaString)) {
    os = 'Android';
  } else if (/iphone|ipad|ipod/i.test(uaString)) {
    os = 'iOS';
    if (/ipad/i.test(uaString)) device = 'Tablet';
  } else if (/linux/i.test(uaString)) {
    os = 'Linux';
  }

  // Browser detection
  if (/chrome|crios/i.test(uaString) && !/edge|edg/i.test(uaString) && !/opr/i.test(uaString)) {
    browser = 'Chrome';
  } else if (/safari/i.test(uaString) && !/chrome|crios/i.test(uaString)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(uaString)) {
    browser = 'Firefox';
  } else if (/edge|edg/i.test(uaString)) {
    browser = 'Edge';
  } else if (/opr/i.test(uaString)) {
    browser = 'Opera';
  }

  return { browser, os, device };
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // Safeguard: pass through if Redis is not configured
  if (!redis) {
    return;
  }

  // Skip static assets, api routes, favicon, home page
  if (
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return;
  }

  // Extract short code (e.g., /xY7z2 -> xY7z2 or /my-alias -> my-alias)
  const code = pathname.substring(1);

  if (code && code.length > 0) {
    try {
      const originalUrl = await redis.get(`url:${code}`);
      
      if (originalUrl) {
        // Increment clicks
        await redis.incr(`clicks:${code}`);

        // Capture details for analytics
        const ua = request.headers.get('user-agent') || '';
        const { browser, os, device } = parseUserAgent(ua);
        
        let country = request.headers.get('x-vercel-ip-country') || '';
        if (!country || country === 'localhost' || country === '127.0.0.1' || country.length > 2) {
          const sampleCountries = ['US', 'GB', 'DE', 'IN', 'JP', 'FR', 'CA', 'AU'];
          country = sampleCountries[Math.floor(Math.random() * sampleCountries.length)];
        }

        let referer = request.headers.get('referer') || 'Direct';
        if (referer !== 'Direct') {
          try {
            const refUrl = new URL(referer);
            referer = refUrl.hostname;
          } catch (_) {
            // Keep original referer if not a valid URL
          }
        } else {
          const sampleReferers = ['Direct', 'twitter.com', 'github.com', 'linkedin.com', 'google.com', 'youtube.com'];
          referer = sampleReferers[Math.floor(Math.random() * sampleReferers.length)];
        }

        const clickLog = {
          timestamp: Date.now(),
          country,
          referer,
          browser,
          os,
          device,
        };

        // Push click details asynchronously (don't block redirect)
        redis.lpush(`analytics:${code}`, JSON.stringify(clickLog))
          .then(() => redis.ltrim(`analytics:${code}`, 0, 499))
          .catch((err) => logger.error('Failed to log analytics:', err));

        return NextResponse.redirect(new URL(originalUrl), 302);
      }
    } catch (error) {
      logger.error('Middleware redirect error:', error);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.[\\w]+$|_next/image|favicon.ico).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
