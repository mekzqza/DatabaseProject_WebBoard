const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/threads
router.get('/', async (req, res) => {
  // join users to include username
  // allow optional q parameter to search by title (case-insensitive)
  const q = (req.query.q || '').toString().trim();
  try {
    if (q) {
      // parameterized query, use LOWER(title) for case-insensitive match
      const sqlq = `SELECT t.thread_id, t.category_id, t.user_id, u.username, t.title, t.content, t.created_at, t.updated_at FROM threads t LEFT JOIN users u ON t.user_id = u.user_id WHERE LOWER(t.title) LIKE ? ORDER BY t.created_at DESC`;
      const [rows] = await pool.query(sqlq, [`%${q.toLowerCase()}%`]);
      return res.json(rows);
    }

    const sql = `SELECT t.thread_id, t.category_id, t.user_id, u.username, t.title, t.content, t.created_at, t.updated_at FROM threads t LEFT JOIN users u ON t.user_id = u.user_id ORDER BY t.created_at DESC`;
    const [rows] = await pool.query(sql);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

// POST /api/threads (create new thread) - requires auth
router.post('/', auth, async (req, res) => {
  const { title, content, category_id } = req.body || {};
  if (!title || !content) return res.status(400).json({ status: false, message: 'title and content are required' });

  const userId = req.user && req.user.user_id;
  if (!userId) return res.status(401).json({ status: false, message: 'Invalid user' });

  const now = new Date();
  const sql = `INSERT INTO threads (category_id, user_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`;
  try {
    const [result] = await pool.query(sql, [category_id || null, userId, title, content, now, now]);
    // select the created thread including username
    const [rows] = await pool.query('SELECT t.thread_id, t.category_id, t.user_id, u.username, t.title, t.content, t.created_at, t.updated_at FROM threads t LEFT JOIN users u ON t.user_id = u.user_id WHERE t.thread_id = ? LIMIT 1', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

module.exports = router;
