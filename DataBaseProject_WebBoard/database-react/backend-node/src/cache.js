const redis = require('./redisClient');

// small helper for JSON caching
const DEFAULT_TTL = process.env.CACHE_TTL_SECONDS ? Number(process.env.CACHE_TTL_SECONDS) : 300; // 5 minutes

async function getJson(key) {
  if (!redis) return null;
  try {
    const v = await redis.get(key);
    if (!v) return null;
    return JSON.parse(v);
  } catch (e) {
    console.error('cache.getJson error', e);
    return null;
  }
}

async function setJson(key, value, ttlSeconds = DEFAULT_TTL) {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (e) {
    console.error('cache.setJson error', e);
  }
}

async function del(key) {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (e) {
    console.error('cache.del error', e);
  }
}

module.exports = { getJson, setJson, del, DEFAULT_TTL };
