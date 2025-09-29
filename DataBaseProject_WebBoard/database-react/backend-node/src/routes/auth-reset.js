const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../db');
const { sendResetEmail } = require('../utils/mailer');
const bcrypt = require('bcryptjs');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// POST /api/auth/request-reset  { email }
router.post('/request-reset', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ status:false, message: 'email required' });

  try {
    const [rows] = await pool.query('SELECT user_id, username FROM users WHERE LOWER(email) = ? LIMIT 1', [email.toLowerCase()]);
    if (!rows || rows.length === 0) {
      // Don't reveal whether email exists
      return res.json({ status: true });
    }
    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expires = new Date(Date.now() + ((process.env.RESET_TOKEN_EXPIRES_MINUTES ? Number(process.env.RESET_TOKEN_EXPIRES_MINUTES) : 60) * 60 * 1000));

    await pool.query('UPDATE users SET reset_token = ?, reset_expires = ? WHERE user_id = ?', [tokenHash, expires, user.user_id]);

    const frontend = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const link = `${frontend}/reset-password?token=${encodeURIComponent(token)}&id=${encodeURIComponent(user.user_id)}`;

    await sendResetEmail(email, link, user.username);

    return res.json({ status: true });
  } catch (err) {
    console.error('request-reset error', err);
    return res.status(500).json({ status:false, message: 'Internal error' });
  }
});

// POST /api/auth/reset-password  { user_id, token, newPassword }
router.post('/reset-password', async (req, res) => {
  const { user_id, token, newPassword } = req.body || {};
  if (!user_id || !token || !newPassword) return res.status(400).json({ status:false, message: 'missing fields' });

  try {
    const tokenHash = hashToken(token);
    const [rows] = await pool.query('SELECT user_id, reset_token, reset_expires FROM users WHERE user_id = ? LIMIT 1', [user_id]);
    if (!rows || rows.length === 0) return res.status(400).json({ status:false, message: 'Invalid' });

    const user = rows[0];
    if (!user.reset_token || !user.reset_expires) return res.status(400).json({ status:false, message: 'Invalid or expired token' });

    const now = new Date();
    const expires = new Date(user.reset_expires);
    if (now > expires) return res.status(400).json({ status:false, message: 'Token expired' });

    if (String(user.reset_token) !== tokenHash) {
      return res.status(400).json({ status:false, message: 'Invalid token' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL, updated_at = ? WHERE user_id = ?', [hashed, new Date(), user_id]);

    return res.json({ status: true });
  } catch (err) {
    console.error('reset-password error', err);
    return res.status(500).json({ status:false, message: 'Internal error' });
  }
});

module.exports = router;
