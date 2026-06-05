import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  console.warn(
    'Upstash Redis environment variables are missing. Please define UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your .env.local file.'
  );
}

export const redis = (redisUrl && redisToken)
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null;
