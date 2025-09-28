const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const redis = require('../redisClient');

// helper to resolve role (JWT may or may not include it)
async function resolveUserRole(userId) {
  try {
    if (!userId) return null;
    const [rows] = await pool.query('SELECT role FROM users WHERE user_id = ? LIMIT 1', [userId]);
    if (rows && rows.length > 0) return rows[0].role;
  } catch (e) {
    console.error('resolveUserRole error', e);
  }
  return null;
}

// GET /api/threads
router.get('/', async (req, res) => {
  // join users to include username
  // allow optional q parameter to search by title (case-insensitive)
  const q = (req.query.q || '').toString().trim();
  const cacheKey = `threads:q=${q}`;
  try {
    // try cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (cacheErr) {
      console.error('Redis GET error', cacheErr);
      // continue to DB on cache errors
    }

    if (q) {
      // parameterized query, use LOWER(title) for case-insensitive match
      const sqlq = `SELECT t.thread_id, t.category_id, t.user_id, u.username, t.title, t.content, t.created_at, t.updated_at FROM threads t LEFT JOIN users u ON t.user_id = u.user_id WHERE LOWER(t.title) LIKE ? ORDER BY t.created_at DESC`;
      const [rows] = await pool.query(sqlq, [`%${q.toLowerCase()}%`]);

      // set cache (expire in seconds)
      try {
        await redis.set(cacheKey, JSON.stringify(rows), { EX: 300 }); // 5 minutes
      } catch (cacheErr) {
        console.error('Redis SET error', cacheErr);
      }

      return res.json(rows);
    }

    const sql = `SELECT t.thread_id, t.category_id, t.user_id, u.username, t.title, t.content, t.created_at, t.updated_at FROM threads t LEFT JOIN users u ON t.user_id = u.user_id ORDER BY t.created_at DESC`;
    const [rows] = await pool.query(sql);

    try {
      await redis.set(cacheKey, JSON.stringify(rows), { EX: 300 });
    } catch (cacheErr) {
      console.error('Redis SET error', cacheErr);
    }

    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

// GET /api/threads/:id - single thread
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ status: false, message: 'id is required' });
  try {
    const cacheKey = `thread:${id}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch (cacheErr) {
      console.error('Redis GET error', cacheErr);
    }

    const sql = `SELECT t.thread_id, t.category_id, t.user_id, u.username, t.title, t.content, t.created_at, t.updated_at FROM threads t LEFT JOIN users u ON t.user_id = u.user_id WHERE t.thread_id = ? LIMIT 1`;
    const [rows] = await pool.query(sql, [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ status: false, message: 'Thread not found' });

    try {
      await redis.set(cacheKey, JSON.stringify(rows[0]), { EX: 300 });
    } catch (cacheErr) {
      console.error('Redis SET error', cacheErr);
    }

    return res.json(rows[0]);
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

    // invalidate related cache keys (simple approach: delete keys matching prefix)
    try {
      const keys = await redis.keys('threads*');
      if (keys.length) {
        await Promise.all(keys.map(k => redis.del(k)));
      }
    } catch (cacheErr) {
      console.error('Redis DEL/KEYS error', cacheErr);
    }

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
  
});

// PUT /api/threads/:id - update a thread (only owner)
router.put('/:id', auth, async (req, res) => {
  const id = req.params.id;
  const userId = req.user && req.user.user_id;
  if (!id) return res.status(400).json({ status: false, message: 'id is required' });
  if (!userId) return res.status(401).json({ status: false, message: 'Invalid user' });

  try {
    // check ownership
    const [rows] = await pool.query('SELECT user_id FROM threads WHERE thread_id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ status: false, message: 'Thread not found' });
    const ownerId = rows[0].user_id;
    if (Number(ownerId) !== Number(userId)) return res.status(403).json({ status: false, message: 'Forbidden. You are not the owner.' });

    // build update
    const body = req.body || {};
    const fields = [];
    const params = [];
    if (body.title) { fields.push('title = ?'); params.push(body.title); }
    if (body.content) { fields.push('content = ?'); params.push(body.content); }
    if (body.category_id !== undefined) { fields.push('category_id = ?'); params.push(body.category_id); }
    if (fields.length === 0) return res.status(400).json({ status: false, message: 'No updatable fields provided' });
    params.push(new Date()); // updated_at
    params.push(id);

    const sql = `UPDATE threads SET ${fields.join(', ')}, updated_at = ? WHERE thread_id = ?`;
    await pool.query(sql, params);

    // return updated row
    const [updatedRows] = await pool.query('SELECT t.thread_id, t.category_id, t.user_id, u.username, t.title, t.content, t.created_at, t.updated_at FROM threads t LEFT JOIN users u ON t.user_id = u.user_id WHERE t.thread_id = ? LIMIT 1', [id]);

    // invalidate cache for this thread and thread lists
    try {
      await redis.del(`thread:${id}`);
      const keys = await redis.keys('threads*');
      if (keys.length) await Promise.all(keys.map(k => redis.del(k)));
    } catch (cacheErr) {
      console.error('Redis DEL error (threads update)', cacheErr);
    }

    return res.json(updatedRows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

// DELETE /api/threads/:id - delete a thread (owner or admin)
router.delete('/:id', auth, async (req, res) => {
  const id = req.params.id;
  const userId = req.user && req.user.user_id;
  if (!id) return res.status(400).json({ status: false, message: 'id is required' });
  if (!userId) return res.status(401).json({ status: false, message: 'Invalid user' });

  try {
    console.log('DELETE /api/threads/:id called', { id, userId, role: req.user && req.user.role });
    // get owner
    const [rows] = await pool.query('SELECT thread_id, user_id FROM threads WHERE thread_id = ? LIMIT 1', [id]);
    console.log('Delete select result rows.length=', (rows && rows.length));
    if (!rows || rows.length === 0) {
      return res.status(404).json({ status: false, message: 'Thread not found (no row)', thread_id: id });
    }
    const ownerId = rows[0].user_id;

    // allow if owner or admin
    let isAdmin = false;
    if (req.user && req.user.role && String(req.user.role).toLowerCase() === 'admin') isAdmin = true;
    if (!isAdmin) {
      const role = await resolveUserRole(userId);
      if (role && String(role).toLowerCase() === 'admin') isAdmin = true;
    }

    if (Number(ownerId) !== Number(userId) && !isAdmin) {
      return res.status(403).json({ status: false, message: 'Forbidden. Only owner or admin can delete.' });
    }

    // delete dependent reports (and other dependent rows if needed) in a transaction
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // remove reports referencing this thread to satisfy FK constraints
      await conn.query('DELETE FROM reports WHERE thread_id = ?', [id]);
      // TODO: if you have replies/comments/attachments tables, delete them here too
      await conn.query('DELETE FROM threads WHERE thread_id = ?', [id]);
      await conn.commit();
      conn.release();

      // invalidate cache for this thread and thread lists
      try {
        await redis.del(`thread:${id}`);
        const keys = await redis.keys('threads*');
        if (keys.length) await Promise.all(keys.map(k => redis.del(k)));
      } catch (cacheErr) {
        console.error('Redis DEL error (threads delete)', cacheErr);
      }

      // invalidate reports caches too (if any)
      try {
        const reportsTable = process.env.REPORTS_TABLE || 'reports';
        await require('../cache').del(`${reportsTable}:list`);
        await require('../cache').del(`${reportsTable}:id:${id}`);
      } catch (e) {
        console.error('Failed to invalidate reports cache after thread delete', e);
      }

      return res.json({ status: true });
    } catch (txErr) {
      try { await conn.rollback(); } catch (e) { /* ignore */ }
      try { conn.release(); } catch (e) { /* ignore */ }
      console.error('Delete thread transaction error', txErr);
      return res.status(500).json({ status: false, message: 'Failed to delete thread' });
    }
  } catch (err) {
    console.error('Delete thread error', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

module.exports = router;
