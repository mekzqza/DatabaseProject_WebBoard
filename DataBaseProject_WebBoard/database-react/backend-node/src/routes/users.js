const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');
const cache = require('../cache');

// GET /api/users/count - return total number of users (cached)
router.get('/count', async (req, res) => {
  try {
    const cacheKey = 'users:count';
    try {
      const cached = await cache.getJson(cacheKey);
      if (cached && typeof cached.count !== 'undefined') return res.json({ status: true, count: Number(cached.count) });
    } catch (cacheErr) {
      // ignore cache errors
    }

    const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM users');
    const cnt = Array.isArray(rows) && rows[0] ? Number(rows[0].cnt || rows[0].CNT || 0) : 0;
    try { await cache.setJson(cacheKey, { count: cnt }, 60); } catch (e) { /* ignore cache set error */ }
    return res.json({ status: true, count: cnt });
  } catch (err) {
    console.error('users/count error', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'users:all';
    try {
      const cached = await cache.getJson(cacheKey);
      if (cached) return res.json(cached);
    } catch (cacheErr) {
      console.error('cache.getJson error (users list)', cacheErr);
    }

    const [rows] = await pool.query('SELECT user_id, username, email, avatar_url, bio, social_links, role, created_at, updated_at FROM users');

    try {
      await cache.setJson(cacheKey, rows);
    } catch (cacheErr) {
      console.error('cache.setJson error (users list)', cacheErr);
    }

    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const cacheKey = `user:${id}`;
    try {
      const cached = await cache.getJson(cacheKey);
      if (cached) return res.json(cached);
    } catch (cacheErr) {
      console.error('cache.getJson error (user)', cacheErr);
    }

    const [rows] = await pool.query('SELECT user_id, username, email, avatar_url, bio, social_links, role, created_at, updated_at FROM users WHERE user_id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ status: false, message: 'User not found' });

    try {
      await cache.setJson(cacheKey, rows[0]);
    } catch (cacheErr) {
      console.error('cache.setJson error (user)', cacheErr);
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

// GET /api/users/check-username?username=...
router.get('/check-username', async (req, res) => {
  const username = (req.query.username || '').toString().trim();
  if (!username) return res.status(400).json({ status: false, message: 'username query required' });
  const key = `username:${username.toLowerCase()}`;
  try {
    try {
      const cached = await redis.get(key);
      if (cached) {
        // cached indicates taken — verify against DB in case cache is stale
        try {
          const [r2] = await pool.query('SELECT user_id FROM users WHERE LOWER(username) = ? LIMIT 1', [username.toLowerCase()]);
          if (r2 && r2.length > 0) {
            return res.json({ available: false });
          } else {
            // stale cache: remove and report available
            try { await redis.del(key); } catch (e) { /* ignore */ }
            return res.json({ available: true });
          }
        } catch (dbErr) {
          console.error('DB verify error (check-username)', dbErr);
          // fallback: treat as unavailable to be safe
          return res.json({ available: false });
        }
      }
    } catch (cacheErr) {
      console.error('Redis GET error (check-username)', cacheErr);
    }

    const [rows] = await pool.query('SELECT user_id FROM users WHERE LOWER(username) = ? LIMIT 1', [username.toLowerCase()]);
    const exists = rows && rows.length > 0;
    if (exists) {
      try { await redis.set(key, '1', { EX: 86400 }); } catch (e) { /* ignore */ }
    }
    return res.json({ available: !exists });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

// GET /api/users/check-email?email=...
router.get('/check-email', async (req, res) => {
  const email = (req.query.email || '').toString().trim();
  if (!email) return res.status(400).json({ status: false, message: 'email query required' });
  const key = `email:${email.toLowerCase()}`;
  try {
    try {
      const cached = await redis.get(key);
      if (cached) {
        // cached indicates taken — verify against DB in case cache is stale
        try {
          const [r2] = await pool.query('SELECT user_id FROM users WHERE LOWER(email) = ? LIMIT 1', [email.toLowerCase()]);
          if (r2 && r2.length > 0) {
            return res.json({ available: false });
          } else {
            // stale cache: remove and report available
            try { await redis.del(key); } catch (e) { /* ignore */ }
            return res.json({ available: true });
          }
        } catch (dbErr) {
          console.error('DB verify error (check-email)', dbErr);
          // fallback: treat as unavailable to be safe
          return res.json({ available: false });
        }
      }
    } catch (cacheErr) {
      console.error('Redis GET error (check-email)', cacheErr);
    }

    const [rows] = await pool.query('SELECT user_id FROM users WHERE LOWER(email) = ? LIMIT 1', [email.toLowerCase()]);
    const exists = rows && rows.length > 0;
    if (exists) {
      try { await redis.set(key, '1', { EX: 86400 }); } catch (e) { /* ignore */ }
    }
    return res.json({ available: !exists });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

// DEV DEBUG: GET /api/users/debug-username?username=...
// Returns whether DB has the username and the Redis key value (if any)
router.get('/debug-username', async (req, res) => {
  const username = (req.query.username || '').toString().trim();
  if (!username) return res.status(400).json({ status: false, message: 'username query required' });
  const key = `username:${username.toLowerCase()}`;
  try {
    const [rows] = await pool.query('SELECT user_id, username FROM users WHERE LOWER(username) = ? LIMIT 1', [username.toLowerCase()]);
    let cached = null;
    try { cached = await redis.get(key); } catch (e) { cached = null; }
    return res.json({ status: true, username, inDb: Array.isArray(rows) && rows.length > 0, dbRow: rows && rows[0] ? rows[0] : null, redisKey: cached });
  } catch (e) {
    console.error('debug-username error', e);
    return res.status(500).json({ status: false, message: 'debug error' });
  }
});

// DEV DEBUG: GET /api/users/debug-email?email=...
router.get('/debug-email', async (req, res) => {
  const email = (req.query.email || '').toString().trim();
  if (!email) return res.status(400).json({ status: false, message: 'email query required' });
  const key = `email:${email.toLowerCase()}`;
  try {
    const [rows] = await pool.query('SELECT user_id, email FROM users WHERE LOWER(email) = ? LIMIT 1', [email.toLowerCase()]);
    let cached = null;
    try { cached = await redis.get(key); } catch (e) { cached = null; }
    return res.json({ status: true, email, inDb: Array.isArray(rows) && rows.length > 0, dbRow: rows && rows[0] ? rows[0] : null, redisKey: cached });
  } catch (e) {
    console.error('debug-email error', e);
    return res.status(500).json({ status: false, message: 'debug error' });
  }
});

// POST /api/users (create user) - same as register but accessible
router.post('/', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password) return res.status(400).json({ status: false, message: 'username and password required' });
  try {
    const [exists] = await pool.query('SELECT user_id FROM users WHERE username = ? LIMIT 1', [username]);
    if (exists && exists.length > 0) return res.status(409).json({ status: false, message: 'username already exists' });
    const hashed = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 10));
    const now = new Date();
    const [result] = await pool.query('INSERT INTO users (username, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [username, email || null, hashed, now, now]);
    // set username/email quick-check keys and invalidate users cache
    try {
      if (username) await cache.setJson(`username:${username.toLowerCase()}`, '1', 86400);
      if (email) await cache.setJson(`email:${email.toLowerCase()}`, '1', 86400);
    } catch (cacheErr) {
      console.error('cache.setJson error (username/email cache)', cacheErr);
    }

    // invalidate users cache keys
    try {
      await cache.del('users:all');
      // also remove user specific cache if exists
      await cache.del(`user:${result.insertId}`);
    } catch (cacheErr) {
      console.error('cache.del error (users)', cacheErr);
    }

    return res.status(201).json({ status: true, user_id: result.insertId, username });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

// PUT /api/users/:id (update user) - partial update, if password provided, hash it
router.put('/:id', auth, async (req, res) => {
  const id = req.params.id;
  const body = req.body || {};

  // allow user to update only own profile unless role/admin logic added (here allow if req.user.user_id == id)
  if (Number(req.user.user_id) !== Number(id)) {
    return res.status(403).json({ status: false, message: 'Forbidden. You can only update your own profile.' });
  }

  // fetch current username/email for cache management
  let currentUser = null;
  try {
    const [curRows] = await pool.query('SELECT username, email FROM users WHERE user_id = ? LIMIT 1', [id]);
    if (curRows && curRows.length > 0) currentUser = curRows[0];
  } catch (e) {
    console.error('Failed to fetch current user for cache management', e);
  }

  const fields = [];
  const params = [];
  if (body.username) { fields.push('username = ?'); params.push(body.username); }
  if (body.email) { fields.push('email = ?'); params.push(body.email); }
  if (body.avatar_url || body.avatar) { fields.push('avatar_url = ?'); params.push(body.avatar_url || body.avatar); }
  if (body.bio) { fields.push('bio = ?'); params.push(body.bio); }
  if (body.social_links || body.social) { fields.push('social_links = ?'); params.push(body.social_links || body.social); }
  if (body.role) { fields.push('role = ?'); params.push(body.role); }
  if (body.password || body.password_hash) {
    const pwd = body.password || body.password_hash;
    const hashed = await bcrypt.hash(pwd, Number(process.env.BCRYPT_ROUNDS || 10));
    fields.push('password_hash = ?'); params.push(hashed);
  }

  if (fields.length === 0) return res.status(400).json({ status: false, message: 'No updatable fields provided' });
  params.push(new Date()); // updated_at
  params.push(id);

  const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = ? WHERE user_id = ?`;
  try {
    const [result] = await pool.query(sql, params);

    // invalidate user cache for this id and users list
    try {
      await cache.del(`user:${id}`);
      await cache.del('users:all');
    } catch (cacheErr) {
      console.error('cache.del error (users update)', cacheErr);
    }

    // manage username/email quick-check cache keys
    try {
      const cur = currentUser || {};
      // if username changed, delete old key and set new
      if (body.username && cur.username && cur.username.toLowerCase() !== body.username.toLowerCase()) {
        try { await redis.del(`username:${cur.username.toLowerCase()}`); } catch (e) {}
        try { await redis.set(`username:${body.username.toLowerCase()}`, '1', { EX: 86400 }); } catch (e) {}
      }
      // if email changed
      if (body.email && cur.email && cur.email.toLowerCase() !== body.email.toLowerCase()) {
        try { await redis.del(`email:${cur.email.toLowerCase()}`); } catch (e) {}
        try { await redis.set(`email:${body.email.toLowerCase()}`, '1', { EX: 86400 }); } catch (e) {}
      }
    } catch (cacheErr) {
      console.error('Redis username/email cache update error', cacheErr);
    }

    return res.json({ status: true, message: 'User updated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

module.exports = router;

