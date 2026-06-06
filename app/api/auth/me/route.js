import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { redis } from '../../../../lib/redis';
import { logger } from '../../../../lib/logger';

export async function GET() {
  if (!redis) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  }

  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json({ authenticated: false });
    }

    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
      return NextResponse.json({ authenticated: false });
    }

    const session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
    const { email } = session;

    const userJson = await redis.get(`user:${email}`);
    if (!userJson) {
      return NextResponse.json({ authenticated: false });
    }

    const user = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;

    // Get user's links
    const linkCodes = await redis.smembers(`user_links:${user.userId}`);
    const links = [];

    if (linkCodes && linkCodes.length > 0) {
      for (const code of linkCodes) {
        const originalUrl = await redis.get(`url:${code}`);
        const clicks = await redis.get(`clicks:${code}`) || 0;
        if (originalUrl) {
          links.push({
            shortCode: code,
            original: originalUrl,
            clicks: parseInt(clicks, 10),
          });
        }
      }
    }

    // Sort links by click count or code
    links.sort((a, b) => b.clicks - a.clicks);

    return NextResponse.json({
      authenticated: true,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name || '',
        phone: user.phone || '',
        emailAnalyticsEnabled: !!user.emailAnalyticsEnabled,
        isPremium: !!user.isPremium,
        provider: user.provider || 'local'
      },
      links,
    });
  } catch (error) {
    logger.error('Me endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
