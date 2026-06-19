import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redis } from '../../../../lib/redis';
import { logger } from '../../../../lib/logger';
import { getOrCreateUserSettings } from '../../../../lib/services/userService';
import { getUserLinks } from '../../../../lib/services/linkService';

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

    // Fetch/migrate settings and retrieve links via Service layer
    const settings = await getOrCreateUserSettings(userId, email);
    const links = await getUserLinks(userId);

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
