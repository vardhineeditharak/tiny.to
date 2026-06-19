import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redis } from '../../../../lib/redis';
import { logger } from '../../../../lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { code } = params;

  if (!redis) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  }

  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Check ownership of the short link
    const isOwner = await redis.sismember(`user_links:${userId}`, code);
    const owner = await redis.get(`url_owner:${code}`);

    // If there is an owner but it's not this user, block access
    if (owner && owner !== userId && !isOwner) {
      return NextResponse.json({ error: 'Forbidden. You do not own this link.' }, { status: 403 });
    }

    // Retrieve original URL & click count
    const originalUrl = await redis.get(`url:${code}`);
    const clicks = await redis.get(`clicks:${code}`) || 0;

    if (!originalUrl) {
      return NextResponse.json({ error: 'Link not found.' }, { status: 404 });
    }

    // Fetch click logs from Redis list
    const logStrings = await redis.lrange(`analytics:${code}`, 0, -1) || [];
    const clickLogs = logStrings.map((log) => {
      try {
        return typeof log === 'string' ? JSON.parse(log) : log;
      } catch (_) {
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({
      shortCode: code,
      original: originalUrl,
      clicks: parseInt(clicks, 10),
      isPremium: true,
      analytics: clickLogs,
    });
  } catch (error) {
    logger.error('Analytics endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
