import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redis } from '../../../../lib/redis';
import { logger } from '../../../../lib/logger';

export async function POST(request) {
  if (!redis) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  }

  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase();

    // Check settings for Clerk user
    let settingsJson = await redis.get(`user:settings:${userId}`);
    let settings = settingsJson ? (typeof settingsJson === 'string' ? JSON.parse(settingsJson) : settingsJson) : {
      emailAnalyticsEnabled: false,
      isPremium: false,
    };

    const { emailAnalyticsEnabled } = await request.json();

    if (emailAnalyticsEnabled !== undefined) {
      settings.emailAnalyticsEnabled = !!emailAnalyticsEnabled;
    }

    // Save updated settings data
    await redis.set(`user:settings:${userId}`, JSON.stringify(settings));

    return NextResponse.json({
      success: true,
      user: {
        userId,
        email,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email,
        phone: clerkUser.phoneNumbers[0]?.phoneNumber || '',
        emailAnalyticsEnabled: !!settings.emailAnalyticsEnabled,
        isPremium: !!settings.isPremium,
        provider: 'clerk'
      }
    });
  } catch (error) {
    logger.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
