import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redis } from '../../../lib/redis';
import { logger } from '../../../lib/logger';

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
    const alias = body.alias ? body.alias.trim() : null;

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

    // Check if user is logged in
    const { userId } = auth();

    let shortCode = '';

    if (alias) {
      // Validate custom alias format
      const aliasRegex = /^[a-zA-Z0-9-_]+$/;
      if (!aliasRegex.test(alias)) {
        return NextResponse.json(
          { error: 'Alias must contain only letters, numbers, dashes, and underscores.' },
          { status: 400 }
        );
      }

      if (alias.length < 3 || alias.length > 30) {
        return NextResponse.json(
          { error: 'Alias must be between 3 and 30 characters long.' },
          { status: 400 }
        );
      }

      // Check if custom alias already exists
      const existingUrl = await redis.get(`url:${alias}`);
      if (existingUrl) {
        return NextResponse.json({ error: 'This custom alias is already taken.' }, { status: 409 });
      }

      shortCode = alias;
      await redis.set(`url:${shortCode}`, originalUrl);
      await redis.set(`clicks:${shortCode}`, 0);
    } else {
      // Try generating a unique code and inserting it (up to 5 retries for collisions)
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
    }

    // If logged in, associate this short code with user profile
    if (userId) {
      await redis.set(`url_owner:${shortCode}`, userId);
      await redis.sadd(`user_links:${userId}`, shortCode);
    }

    return NextResponse.json({ shortCode });
  } catch (error) {
    logger.error('Error in /api/shorten:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!redis) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Short code is required.' }, { status: 400 });
    }

    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const isOwner = await redis.sismember(`user_links:${userId}`, code);
    const owner = await redis.get(`url_owner:${code}`);

    if (owner && owner !== userId && !isOwner) {
      return NextResponse.json({ error: 'Forbidden. You do not own this link.' }, { status: 403 });
    }

    const pipeline = redis.pipeline();
    pipeline.del(`url:${code}`);
    pipeline.del(`clicks:${code}`);
    pipeline.del(`url_owner:${code}`);
    pipeline.del(`analytics:${code}`);
    pipeline.srem(`user_links:${userId}`, code);
    await pipeline.exec();

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete link error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
