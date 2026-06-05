import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { redis } from '../../../../../lib/redis';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/?error=No+authorization+code+provided', request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/?error=Google+OAuth+credentials+are+not+fully+configured', request.url));
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();
    if (tokens.error) {
      console.error('Token exchange error:', tokens);
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(tokens.error_description || tokens.error)}`, request.url)
      );
    }

    // Get user info using access token
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const userInfo = await userInfoResponse.json();
    if (userInfo.error) {
      console.error('UserInfo error:', userInfo);
      return NextResponse.redirect(new URL('/?error=Failed+to+retrieve+profile+information', request.url));
    }

    const { email, name, picture } = userInfo;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const userExists = await redis.get(`user:${normalizedEmail}`);
    let user = userExists ? (typeof userExists === 'string' ? JSON.parse(userExists) : userExists) : null;

    const userId = user ? user.userId : crypto.randomUUID();

    if (!user) {
      // Register new user
      user = {
        userId,
        email: normalizedEmail,
        passwordHash: '',
        name: name || '',
        phone: '',
        emailAnalyticsEnabled: true,
        isPremium: false,
        provider: 'google',
        picture: picture || ''
      };
    } else {
      user.provider = 'google';
      if (name && !user.name) user.name = name;
      if (picture) user.picture = picture;
    }

    // Save user profile in Redis
    await redis.set(`user:${normalizedEmail}`, JSON.stringify(user));

    // Create session
    const sessionId = crypto.randomUUID();
    await redis.set(`session:${sessionId}`, JSON.stringify({ userId, email: normalizedEmail }), { ex: 60 * 60 * 24 * 7 });

    // Set session cookie
    const cookieStore = cookies();
    cookieStore.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(new URL('/?error=Authentication+failed+due+to+server+error', request.url));
  }
}
