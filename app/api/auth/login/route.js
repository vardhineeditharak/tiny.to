import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { redis } from '../../../../lib/redis';
import { logger } from '../../../../lib/logger';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function POST(request) {
  if (!redis) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Get user
    const userJson = await redis.get(`user:${normalizedEmail}`);
    if (!userJson) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const user = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
    const computedHash = await hashPassword(password);

    if (user.passwordHash !== computedHash) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Create session
    const sessionId = crypto.randomUUID();
    await redis.set(`session:${sessionId}`, JSON.stringify({ userId: user.userId, email: normalizedEmail }), { ex: 60 * 60 * 24 * 7 });

    // Set session cookie
    const cookieStore = cookies();
    cookieStore.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name || '',
        phone: user.phone || '',
        emailAnalyticsEnabled: !!user.emailAnalyticsEnabled,
        isPremium: !!user.isPremium,
        provider: user.provider || 'local'
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
