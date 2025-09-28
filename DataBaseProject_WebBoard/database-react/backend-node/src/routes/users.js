const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');
const redis = require('../redisClient');

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'users:all';
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch (cacheErr) {
      console.error('Redis GET error (users list)', cacheErr);
    }

    const [rows] = await pool.query('SELECT user_id, username, email, avatar_url, bio, social_links, role, created_at, updated_at FROM users');

    try {
      await redis.set(cacheKey, JSON.stringify(rows), { EX: 300 });
    } catch (cacheErr) {
      console.error('Redis SET error (users list)', cacheErr);
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
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch (cacheErr) {
      console.error('Redis GET error (user)', cacheErr);
    }

    const [rows] = await pool.query('SELECT user_id, username, email, avatar_url, bio, social_links, role, created_at, updated_at FROM users WHERE user_id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ status: false, message: 'User not found' });

    try {
      await redis.set(cacheKey, JSON.stringify(rows[0]), { EX: 300 });
    } catch (cacheErr) {
      console.error('Redis SET error (user)', cacheErr);
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
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

    // invalidate users cache
    try {
      const keys = await redis.keys('users*');
      if (keys.length) {
        await Promise.all(keys.map(k => redis.del(k)));
      }
    } catch (cacheErr) {
      console.error('Redis DEL/KEYS error (users)', cacheErr);
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
      await redis.del(`user:${id}`);
      const keys = await redis.keys('users*');
      if (keys.length) await Promise.all(keys.map(k => redis.del(k)));
    } catch (cacheErr) {
      console.error('Redis DEL error (users update)', cacheErr);
    }

    return res.json({ status: true, message: 'User updated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

module.exports = router;

