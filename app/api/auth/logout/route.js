import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { redis } from '../../../../lib/redis';

export async function POST() {
  if (!redis) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  }

  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (sessionId) {
      await redis.del(`session:${sessionId}`);
    }

    cookieStore.delete('session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
