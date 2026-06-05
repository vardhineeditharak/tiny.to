import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { redis } from '../../../lib/redis';

export async function POST() {
  if (!redis) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  }

  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
    const { email } = session;

    const userJson = await redis.get(`user:${email}`);
    if (!userJson) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const user = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
    user.isPremium = true;

    // Update user profile in Redis
    await redis.set(`user:${email}`, JSON.stringify(user));

    return NextResponse.json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email,
        isPremium: true,
      }
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
