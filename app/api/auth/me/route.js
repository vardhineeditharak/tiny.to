import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redis } from '../../../../lib/redis';
import { logger } from '../../../../lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!redis) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  }

  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ authenticated: false });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ authenticated: false });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase();

    // Check settings for Clerk user
    let settingsJson = await redis.get(`user:settings:${userId}`);
    let settings = settingsJson ? (typeof settingsJson === 'string' ? JSON.parse(settingsJson) : settingsJson) : null;

    // Migrate existing local/Google oauth user links if same email exists
    if (!settings && email) {
      const oldUserJson = await redis.get(`user:${email}`);
      if (oldUserJson) {
        const oldUser = typeof oldUserJson === 'string' ? JSON.parse(oldUserJson) : oldUserJson;
        
        // Migrate links to Clerk userId
        const oldLinkCodes = await redis.smembers(`user_links:${oldUser.userId}`);
        if (oldLinkCodes && oldLinkCodes.length > 0) {
          for (const code of oldLinkCodes) {
            await redis.sadd(`user_links:${userId}`, code);
            await redis.set(`url_owner:${code}`, userId);
          }
        }

        settings = {
          emailAnalyticsEnabled: !!oldUser.emailAnalyticsEnabled,
          isPremium: !!oldUser.isPremium,
        };
        await redis.set(`user:settings:${userId}`, JSON.stringify(settings));
      }
    }

    if (!settings) {
      settings = {
        emailAnalyticsEnabled: false,
        isPremium: false,
      };
      await redis.set(`user:settings:${userId}`, JSON.stringify(settings));
    }

    // Get user's links
    const linkCodes = await redis.smembers(`user_links:${userId}`);
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

    // Sort links by click count
    links.sort((a, b) => b.clicks - a.clicks);

    return NextResponse.json({
      authenticated: true,
      user: {
        userId,
        email,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email,
        phone: clerkUser.phoneNumbers[0]?.phoneNumber || '',
        emailAnalyticsEnabled: !!settings.emailAnalyticsEnabled,
        isPremium: !!settings.isPremium,
        provider: 'clerk'
      },
      links,
    });
  } catch (error) {
    logger.error('Me endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
