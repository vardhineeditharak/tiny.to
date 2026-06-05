import { NextResponse } from 'next/server';
import { redis } from '../../../lib/redis';

// Generate a random, readable short code (length 5)
// Avoid confusing characters: 0, O, I, l, 1
const ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateShortCode() {
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return result;
}

// GET handler to check service setup status
export async function GET() {
  if (!redis) {
    return new Response(JSON.stringify({ active: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return NextResponse.json({ active: true });
}

export async function POST(request) {
  if (!redis) {
    return NextResponse.json(
      { error: 'Database connection parameters are not configured.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    let originalUrl = body.url;

    if (!originalUrl) {
      return NextResponse.json({ error: 'URL is required.' }, { status: 400 });
    }

    // Basic URL validation
    try {
      new URL(originalUrl);
    } catch (e) {
      // If it doesn't have a protocol, prepend https://
      if (!/^https?:\/\//i.test(originalUrl)) {
        originalUrl = `https://${originalUrl}`;
        // Validate again
        try {
          new URL(originalUrl);
        } catch (_) {
          return NextResponse.json({ error: 'Invalid URL format.' }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: 'Invalid URL format.' }, { status: 400 });
      }
    }

    // Try generating a unique code and inserting it (up to 5 retries for collisions)
    let shortCode = '';
    let success = false;
    let attempts = 0;

    while (!success && attempts < 5) {
      shortCode = generateShortCode();
      attempts++;

      // Set key with NX (set only if not exists)
      const setStatus = await redis.set(`url:${shortCode}`, originalUrl, { nx: true });
      
      if (setStatus === 'OK' || setStatus === true || setStatus === 1) {
        // Initialize click counter to 0
        await redis.set(`clicks:${shortCode}`, 0);
        success = true;
      }
    }

    if (!success) {
      return NextResponse.json({ error: 'Could not generate a unique short code.' }, { status: 500 });
    }

    return NextResponse.json({ shortCode });
  } catch (error) {
    console.error('Error in /api/shorten:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
