import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redis } from '../../../../lib/redis';
import { logger } from '../../../../lib/logger';
import { updateUserSettings } from '../../../../lib/services/userService';

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
    const updates = await request.json();

    // Update settings using Service layer
    const settings = await updateUserSettings(userId, updates);

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
