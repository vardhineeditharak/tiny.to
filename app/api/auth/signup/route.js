import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { redis } from '../../../../lib/redis';

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
    const { email, password, name, phone, emailAnalyticsEnabled, provider } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const userExists = await redis.get(`user:${normalizedEmail}`);
    let user = userExists ? (typeof userExists === 'string' ? JSON.parse(userExists) : userExists) : null;

    if (user && provider !== 'google') {
      return NextResponse.json({ error: 'User already exists.' }, { status: 409 });
    }

    const userId = user ? user.userId : crypto.randomUUID();
    let passwordHash = user ? user.passwordHash : '';

    if (provider === 'google') {
      // If logging in / registering with Google, we construct or update user metadata
      user = {
        userId,
        email: normalizedEmail,
        passwordHash,
        name: name || user?.name || 'Google User',
        phone: phone || user?.phone || '',
        emailAnalyticsEnabled: emailAnalyticsEnabled !== undefined ? emailAnalyticsEnabled : (user?.emailAnalyticsEnabled || false),
        isPremium: user ? !!user.isPremium : false,
        provider: 'google'
      };
    } else {
      // Standard Registration
      if (!password || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
      }
      passwordHash = await hashPassword(password);
      user = {
        userId,
        email: normalizedEmail,
        passwordHash,
        name: name || '',
        phone: phone || '',
        emailAnalyticsEnabled: !!emailAnalyticsEnabled,
        isPremium: false,
        provider: 'local'
      };
    }

    // Store user data
    await redis.set(`user:${normalizedEmail}`, JSON.stringify(user));

    // Create session
    const sessionId = crypto.randomUUID();
    await redis.set(`session:${sessionId}`, JSON.stringify({ userId, email: normalizedEmail }), { ex: 60 * 60 * 24 * 7 }); // 7 days

    // Set session cookie
    const cookieStore = cookies();
    cookieStore.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      user: {
        userId,
        email: normalizedEmail,
        name: user.name,
        phone: user.phone,
        emailAnalyticsEnabled: user.emailAnalyticsEnabled,
        isPremium: user.isPremium,
        provider: user.provider
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
