import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { redis } from '../../../../lib/redis';
import { logger } from '../../../../lib/logger';
import { hashPassword } from '../../../../lib/auth';

export async function POST(request) {
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
    const { email } = session;

    const userJson = await redis.get(`user:${email}`);
    if (!userJson) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const user = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
    const { name, phone, emailAnalyticsEnabled, oldPassword, newPassword } = await request.json();

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (emailAnalyticsEnabled !== undefined) user.emailAnalyticsEnabled = !!emailAnalyticsEnabled;

    if (newPassword !== undefined) {
      if (user.passwordHash) {
        if (!oldPassword) {
          return NextResponse.json({ error: 'Current password is required to change password.' }, { status: 400 });
        }
        const oldHash = await hashPassword(oldPassword);
        if (oldHash !== user.passwordHash) {
          return NextResponse.json({ error: 'Incorrect current password.' }, { status: 400 });
        }
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
      }
      user.passwordHash = await hashPassword(newPassword);
    }

    // Save updated user data
    await redis.set(`user:${email}`, JSON.stringify(user));

    return NextResponse.json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        phone: user.phone,
        emailAnalyticsEnabled: user.emailAnalyticsEnabled,
        isPremium: user.isPremium,
        provider: user.provider
      }
    });
  } catch (error) {
    logger.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
