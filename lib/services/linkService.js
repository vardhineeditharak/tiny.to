import { redis } from '../redis';

export async function getUserLinks(userId) {
  const linkCodes = await redis.smembers(`user_links:${userId}`);
  if (!linkCodes || linkCodes.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const code of linkCodes) {
    pipeline.get(`url:${code}`);
    pipeline.get(`clicks:${code}`);
  }

  const results = await pipeline.exec();
  const links = [];

  for (let i = 0; i < linkCodes.length; i++) {
    const code = linkCodes[i];
    const originalUrl = results[i * 2];
    const clicks = results[i * 2 + 1] || 0;

    if (originalUrl) {
      links.push({
        shortCode: code,
        original: originalUrl,
        clicks: parseInt(clicks, 10),
      });
    }
  }

  // Sort links by click count descending
  return links.sort((a, b) => b.clicks - a.clicks);
}
