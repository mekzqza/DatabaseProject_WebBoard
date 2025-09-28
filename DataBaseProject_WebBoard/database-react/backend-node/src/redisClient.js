const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const client = createClient({ url: redisUrl });

client.on('error', (err) => {
  console.error('Redis Client Error', err);
});

(async () => {
  try {
    await client.connect();
    console.log('Redis connected');
  } catch (e) {
    console.error('Failed to connect to Redis', e);
  }
})();

module.exports = client;
