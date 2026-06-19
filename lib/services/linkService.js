import { redis } from '../redis';

export async function getUserLinks(userId) {
  const linkCodes = await redis.smembers(`user_links:${userId}`);
  const links = [];

  if (linkCodes && linkCodes.length > 0) {
    for (const code of linkCodes) {
      const originalUrl = await redis.get(`url:${code}`);
      const clicks = await redis.get(`clicks:${code}`) || 0;
      if (originalUrl) {
        links.push({
          shortCode: code,
          original: originalUrl,
          clicks: parseInt(clicks, 10),
        });
      }
    }
  }

  // Sort links by click count descending
  return links.sort((a, b) => b.clicks - a.clicks);
}
