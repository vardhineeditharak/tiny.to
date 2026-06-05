import { NextResponse } from 'next/server';
import { redis } from '../../lib/redis';

export async function GET(request, { params }) {
  const { code } = params;

  if (!redis) {
    return new Response('Database not configured', { status: 503 });
  }

  try {
    // Fetch original URL from Redis
    const originalUrl = await redis.get(`url:${code}`);

    if (originalUrl) {
      // Increment click count asynchronously (do not block the user's redirect)
      redis.incr(`clicks:${code}`).catch((err) => {
        console.error('Failed to increment click count:', err);
      });

      // Redirect to original URL
      return NextResponse.redirect(new URL(originalUrl), 302);
    }
  } catch (error) {
    console.error('Error during redirection:', error);
  }

  // If not found, return an aesthetic, custom inline HTML 404 page
  return new Response(
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Link Not Found — Briefly</title>
      <style>
        body {
          background-color: oklch(0.08 0.01 240);
          color: oklch(0.97 0.005 240);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          text-align: center;
          padding: 1.5rem;
        }
        h1 {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 300;
          letter-spacing: -0.04em;
          margin-bottom: 0.5rem;
        }
        p {
          color: oklch(0.60 0.01 240);
          font-size: 1rem;
          margin-bottom: 2rem;
          font-weight: 300;
        }
        a {
          color: oklch(0.78 0.14 145);
          text-decoration: none;
          border: 1px solid oklch(0.18 0.01 240);
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          background-color: oklch(0.12 0.01 240);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        a:hover {
          border-color: oklch(0.78 0.14 145);
          background-color: oklch(0.15 0.01 240);
        }
      </style>
    </head>
    <body>
      <h1>Link not found</h1>
      <p>The link you are trying to reach might have expired or never existed.</p>
      <a href="/">Go to briefly</a>
    </body>
    </html>`,
    {
      status: 404,
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}
