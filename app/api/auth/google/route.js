import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const redirectUri = `${appUrl}/api/auth/google/callback`;
  
  if (!clientId) {
    return NextResponse.json({ 
      error: 'GOOGLE_CLIENT_ID is not configured. Please define it in your .env.local file.' 
    }, { status: 500 });
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('openid email profile')}&prompt=select_account`;

  return NextResponse.redirect(googleAuthUrl);
}
