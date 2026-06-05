import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { redis } from '../../../../lib/redis';

export async function GET(request, { params }) {
  const { code } = params;

  if (!redis) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  }

  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
    const { email, userId } = session;

    // Check if user is premium
    const userJson = await redis.get(`user:${email}`);
    if (!userJson) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    const user = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;

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

    // If user is not premium, we restrict detailed logs but still return the click count
    if (!user.isPremium) {
      return NextResponse.json({
        shortCode: code,
        original: originalUrl,
        clicks: parseInt(clicks, 10),
        isPremium: false,
        analytics: [] // Empty for non-premium
      });
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
    console.error('Analytics endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
