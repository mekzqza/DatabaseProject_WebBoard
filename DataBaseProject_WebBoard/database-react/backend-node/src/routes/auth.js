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
  body('email').optional().isEmail().normalizeEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: false, message: 'Validation error', errors: errors.array() });
    }

    const { username, password, email } = req.body;
    try {
      const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const now = new Date();

      // Atomic insert: only insert if username/email do NOT already exist.
      // This avoids race conditions and avoids triggering a duplicate-key insert attempt.
      const insertSql = `
        INSERT INTO users (username, email, password_hash, avatar_url, bio, social_links, role, created_at, updated_at)
        SELECT t.username, t.email, t.password_hash, t.avatar_url, t.bio, t.social_links, t.role, t.created_at, t.updated_at
        FROM (SELECT ? AS username, ? AS email, ? AS password_hash, NULL AS avatar_url, NULL AS bio, NULL AS social_links, 'user' AS role, ? AS created_at, ? AS updated_at) AS t
        WHERE NOT EXISTS (
          SELECT 1 FROM users u WHERE u.username = ? OR ( ? IS NOT NULL AND u.email = ? )
        )
        LIMIT 1
      `;

      const params = [username, email || null, hashed, now, now, username, email || null, email || null];
      const [result] = await pool.query(insertSql, params);

      // If no rows affected, the username or email already exists
      if (!result || result.affectedRows === 0) {
        return res.status(409).json({ status: false, message: 'username or email already exists' });
      }

      // invalidate users cache so list will refresh
      try {
        const keys = await redis.keys('users*');
        if (keys.length) await Promise.all(keys.map(k => redis.del(k)));
      } catch (cacheErr) {
        console.error('Redis DEL error (auth register)', cacheErr);
      }

      // set quick-lookup flags for username/email in redis to speed availability checks
      try {
        if (username) {
          const key = `username:${username.toLowerCase()}`;
          await redis.set(key, '1', { EX: 86400 });
        }
        if (email) {
          const ekey = `email:${email.toLowerCase()}`;
          await redis.set(ekey, '1', { EX: 86400 });
        }
      } catch (setErr) {
        console.error('Redis SET error (auth register)', setErr);
      }

      return res.status(201).json({ status: true, message: 'User created', username });
    } catch (err) {
      console.error(err);
      // handle MySQL duplicate key error more gracefully
      if (err && err.code === 'ER_DUP_ENTRY') {
        const msg = err.sqlMessage || err.message || '';
        const m = msg.match(/for key '([^']+)'/);
        let field = 'value';
        if (m && m[1]) {
          const key = m[1];
          if (key.toLowerCase().includes('email')) field = 'email';
          else if (key.toLowerCase().includes('username')) field = 'username';
        }
        return res.status(409).json({ status: false, message: `Duplicate ${field}` });
      }
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

// POST /api/auth/forgot-password
router.post('/auth/forgot-password',
  body('email').isEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: false, message: 'Validation error', errors: errors.array() });
    }

    const { email } = req.body;
    try {
      // Check if a user exists with that email (do not reveal existence)
      const [rows] = await pool.query('SELECT user_id, email FROM users WHERE email = ? LIMIT 1', [email]);

      // TODO: create reset token and send email. For now, return generic response.
      console.log('Forgot password requested for email:', email, 'userFound=', (rows && rows.length > 0));

      return res.json({ status: true, message: 'If that email exists in our system, a reset link has been sent.' });
    } catch (err) {
      console.error('Forgot password error', err);
      return res.status(500).json({ status: false, message: 'Internal server error' });
    }
  }
);

module.exports = router;

