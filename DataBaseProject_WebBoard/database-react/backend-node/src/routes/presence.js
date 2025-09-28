const express = require('express');
const router = express.Router();
const redis = require('../redisClient');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'replace_with_a_long_secret';

// Middleware to mark an authenticated user as online. Sets a short TTL key per user.
async function markOnline(req, res, next) {
  try {
    if (req.user && req.user.user_id) {
      const uid = String(req.user.user_id);
      const key = `online:${uid}`;
      // set with short TTL (e.g., 60s). Clients should call periodically (every 30s) or rely on other authenticated requests.
      await redis.set(key, '1', { EX: 60 });
    }
  } catch (e) {
    // don't block on redis errors
    console.error('Presence markOnline error', e);
  }
  next();
}

// GET /api/online/count
// Returns { status: true, count: <number> }
// Count endpoint — if an Authorization header with a valid token is provided,
// we will mark that user online as part of the same request. Otherwise we simply return the count.
router.get('/count', async (req, res) => {
  try {
    // If auth token present, try to verify and set req.user so markOnline can run
    try {
      const authHeader = req.headers && req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const payload = jwt.verify(token, JWT_SECRET);
          req.user = payload;
          // mark online for this request
          await markOnline(req, res, () => {});
        } catch (e) {
          // ignore verification error — we will still return the count
        }
      }
    } catch (e) {
      // ignore
    }

    // Use SCAN to count keys matching online:*
    let cursor = '0';
    let count = 0;
    do {
      const reply = await redis.scan(cursor, { MATCH: 'online:*', COUNT: 100 });
      // node-redis v4 returns an object { cursor, keys }
      cursor = reply.cursor || reply[0] || '0';
      const keys = reply.keys || reply[1] || [];
      count += (keys.length || 0);
    } while (cursor !== '0');

    return res.json({ status: true, count });
  } catch (e) {
    console.error('Presence count error', e);
    return res.status(500).json({ status: false, message: 'Failed to read presence' });
  }
});

// POST /api/online/mark - explicit heartbeat for authenticated clients
router.post('/mark', auth, async (req, res) => {
  try {
    await markOnline(req, res, () => {});
    return res.json({ status: true });
  } catch (e) {
    console.error('Presence mark error', e);
    return res.status(500).json({ status: false, message: 'Failed to mark online' });
  }
});

// Expose middleware so other routes can use it if desired
router.markOnline = markOnline;

module.exports = router;
