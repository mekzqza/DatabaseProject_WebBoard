const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);
const JWT_SECRET = process.env.JWT_SECRET || 'replace_with_a_long_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const redis = require('../redisClient');

// POST /api/register
router.post('/register',
  body('username').isLength({ min: 3 }).trim(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: false, message: 'Validation error', errors: errors.array() });
    }

    const { username, password, email } = req.body;
    try {
      const [rows] = await pool.query('SELECT user_id FROM users WHERE username = ? LIMIT 1', [username]);
      if (rows && rows.length > 0) {
        return res.status(409).json({ status: false, message: 'username already exists' });
      }

      const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const now = new Date();
      const insertSql = `INSERT INTO users (username, email, password_hash, avatar_url, bio, social_links, role, created_at, updated_at) VALUES (?, ?, ?, NULL, NULL, NULL, 'user', ?, ?)`;
      const [result] = await pool.query(insertSql, [username, email || null, hashed, now, now]);

      // invalidate users cache so list will refresh
      try {
        const keys = await redis.keys('users*');
        if (keys.length) await Promise.all(keys.map(k => redis.del(k)));
      } catch (cacheErr) {
        console.error('Redis DEL error (auth register)', cacheErr);
      }

      return res.status(201).json({ status: true, message: 'User created', username });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: 'Internal server error' });
    }
  }
);

// POST /api/login
router.post('/login',
  body('username').exists(),
  body('password').exists(),
  async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ status: false, message: 'username and password are required' });

    try {
      const [rows] = await pool.query('SELECT user_id, username, email, password_hash, avatar_url, bio, social_links, role FROM users WHERE username = ? LIMIT 1', [username]);
      if (!rows || rows.length === 0) {
        return res.status(401).json({ status: false, message: 'Invalid username or password' });
      }
      const user = rows[0];
      const match = await bcrypt.compare(password, user.password_hash || user.password);
      if (!match) return res.status(401).json({ status: false, message: 'Invalid username or password' });

      const payload = { user_id: user.user_id, username: user.username };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      // remove password_hash before returning user
      delete user.password_hash;

      return res.json({ status: true, token, username: user.username, user });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: 'Internal server error' });
    }
  }
);

module.exports = router;

