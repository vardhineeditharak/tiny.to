import { redis } from '../redis';

export async function getOrCreateUserSettings(userId, email) {
  let settingsJson = await redis.get(`user:settings:${userId}`);
  let settings = settingsJson ? (typeof settingsJson === 'string' ? JSON.parse(settingsJson) : settingsJson) : null;

  // Migrate existing local/Google oauth user links if same email exists
  if (!settings && email) {
    settings = await migrateLegacyUser(userId, email);
  }

  if (!settings) {
    settings = {
      emailAnalyticsEnabled: false,
      isPremium: false,
    };
    await redis.set(`user:settings:${userId}`, JSON.stringify(settings));
  }

  return settings;
}

export async function updateUserSettings(userId, updates) {
  let settings = await getOrCreateUserSettings(userId);
  
  if (updates.emailAnalyticsEnabled !== undefined) {
    settings.emailAnalyticsEnabled = !!updates.emailAnalyticsEnabled;
  }
  
  await redis.set(`user:settings:${userId}`, JSON.stringify(settings));
  return settings;
}

async function migrateLegacyUser(userId, email) {
  const oldUserJson = await redis.get(`user:${email}`);
  if (!oldUserJson) return null;

  const oldUser = typeof oldUserJson === 'string' ? JSON.parse(oldUserJson) : oldUserJson;
  
  // Migrate links to Clerk userId
  const oldLinkCodes = await redis.smembers(`user_links:${oldUser.userId}`);
  if (oldLinkCodes && oldLinkCodes.length > 0) {
    for (const code of oldLinkCodes) {
      await redis.sadd(`user_links:${userId}`, code);
      await redis.set(`url_owner:${code}`, userId);
    }
  }

  const settings = {
    emailAnalyticsEnabled: !!oldUser.emailAnalyticsEnabled,
    isPremium: !!oldUser.isPremium,
  };
  await redis.set(`user:settings:${userId}`, JSON.stringify(settings));
  return settings;
}
