const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const redis = require('../redisClient');

// helper to resolve role (same as threads.js)
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

// GET /api/posts?thread_id=...  (list posts for a thread)
router.get('/', async (req, res) => {
  const threadId = req.query.thread_id;
  if (!threadId) return res.status(400).json({ status: false, message: 'thread_id query required' });
  const cacheKey = `posts:thread:${threadId}`;
  try {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch (cacheErr) {
      console.error('Redis GET error (posts list)', cacheErr);
    }

  const sql = `SELECT p.post_id, p.thread_id, p.user_id, u.username, u.avatar_url, p.content, p.like_count, p.created_at, p.updated_at FROM posts p LEFT JOIN users u ON p.user_id = u.user_id WHERE p.thread_id = ? ORDER BY p.created_at ASC`;
    const [rows] = await pool.query(sql, [threadId]);

    try {
      await redis.set(cacheKey, JSON.stringify(rows), { EX: 300 });
    } catch (cacheErr) {
      console.error('Redis SET error (posts list)', cacheErr);
    }

    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

// GET /api/posts/:id
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ status: false, message: 'id is required' });
  try {
    const cacheKey = `post:${id}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch (cacheErr) {
      console.error('Redis GET error (post)', cacheErr);
    }

  const sql = `SELECT p.post_id, p.thread_id, p.user_id, u.username, u.avatar_url, p.content, p.like_count, p.created_at, p.updated_at FROM posts p LEFT JOIN users u ON p.user_id = u.user_id WHERE p.post_id = ? LIMIT 1`;
    const [rows] = await pool.query(sql, [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ status: false, message: 'Post not found' });

    try {
      await redis.set(cacheKey, JSON.stringify(rows[0]), { EX: 300 });
    } catch (cacheErr) {
      console.error('Redis SET error (post)', cacheErr);
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

// GET /api/posts/:id/liked - is current user liked this post
router.get('/:id/liked', auth, async (req, res) => {
  const id = req.params.id;
  const userId = req.user && req.user.user_id;
  if (!id) return res.status(400).json({ status: false, message: 'id is required' });
  if (!userId) return res.status(401).json({ status: false, message: 'Invalid user' });
  try {
    // ensure posts_likes table exists
    await pool.query(`CREATE TABLE IF NOT EXISTS posts_likes (id BIGINT AUTO_INCREMENT PRIMARY KEY, post_id BIGINT NOT NULL, user_id BIGINT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY (post_id, user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    const [rows] = await pool.query('SELECT 1 FROM posts_likes WHERE post_id = ? AND user_id = ? LIMIT 1', [id, userId]);
    return res.json({ liked: !!(rows && rows.length) });
  } catch (err) {
    console.error('Liked check error', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

// POST /api/posts (create comment) - requires auth
router.post('/', auth, async (req, res) => {
  const { thread_id, content } = req.body || {};
  if (!thread_id || !content) return res.status(400).json({ status: false, message: 'thread_id and content are required' });
  const userId = req.user && req.user.user_id;
  if (!userId) return res.status(401).json({ status: false, message: 'Invalid user' });

  const now = new Date();
  const sql = `INSERT INTO posts (thread_id, user_id, content, like_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`;
  try {
    const [result] = await pool.query(sql, [thread_id, userId, content, 0, now, now]);

    // select created post with username
  const [rows] = await pool.query('SELECT p.post_id, p.thread_id, p.user_id, u.username, u.avatar_url, p.content, p.like_count, p.created_at, p.updated_at FROM posts p LEFT JOIN users u ON p.user_id = u.user_id WHERE p.post_id = ? LIMIT 1', [result.insertId]);

    // invalidate posts cache for this thread and any posts lists
    try {
      await redis.del(`post:${result.insertId}`);
      const keys = await redis.keys(`posts:thread:${thread_id}*`);
      if (keys.length) await Promise.all(keys.map(k => redis.del(k)));
    } catch (cacheErr) {
      console.error('Redis DEL error (posts create)', cacheErr);
    }

    // also consider invalidating thread cache (thread updated)
    try {
      await redis.del(`thread:${thread_id}`);
      const tkeys = await redis.keys('threads*');
      if (tkeys.length) await Promise.all(tkeys.map(k => redis.del(k)));
    } catch (e) {
      console.error('Failed to invalidate thread cache after post create', e);
    }

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

// PUT /api/posts/:id - update post (owner only)
router.put('/:id', auth, async (req, res) => {
  const id = req.params.id;
  const userId = req.user && req.user.user_id;
  if (!id) return res.status(400).json({ status: false, message: 'id is required' });
  if (!userId) return res.status(401).json({ status: false, message: 'Invalid user' });

  try {
    // fetch post owner/thread
    const [rows] = await pool.query('SELECT user_id, thread_id FROM posts WHERE post_id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ status: false, message: 'Post not found' });
    const ownerId = rows[0].user_id;
    const threadId = rows[0].thread_id;

    const body = req.body || {};
    const isLikeOnly = Object.keys(body).length === 1 && body.like_count !== undefined;

    // allow any authenticated user to update like_count only
    if (!isLikeOnly) {
      // enforce owner/admin for other updates
      if (Number(ownerId) !== Number(userId)) {
        // check admin role
        let isAdmin = false;
        if (req.user && req.user.role && String(req.user.role).toLowerCase() === 'admin') isAdmin = true;
        if (!isAdmin) {
          const role = await resolveUserRole(userId);
          if (role && String(role).toLowerCase() === 'admin') isAdmin = true;
        }
        if (!isAdmin && Number(ownerId) !== Number(userId)) {
          return res.status(403).json({ status: false, message: 'Forbidden. You are not the owner.' });
        }
      }
    }

    const fields = [];
    const params = [];
    if (body.content) { fields.push('content = ?'); params.push(body.content); }
    if (body.like_count !== undefined) { fields.push('like_count = ?'); params.push(body.like_count); }
    if (fields.length === 0) return res.status(400).json({ status: false, message: 'No updatable fields provided' });
    params.push(new Date()); // updated_at
    params.push(id);

    const sql = `UPDATE posts SET ${fields.join(', ')}, updated_at = ? WHERE post_id = ?`;
    await pool.query(sql, params);

    // return updated row (include avatar_url)
    const [updatedRows] = await pool.query('SELECT p.post_id, p.thread_id, p.user_id, u.username, u.avatar_url, p.content, p.like_count, p.created_at, p.updated_at FROM posts p LEFT JOIN users u ON p.user_id = u.user_id WHERE p.post_id = ? LIMIT 1', [id]);

    // invalidate caches
    try {
      await redis.del(`post:${id}`);
      if (threadId) {
        const keys = await redis.keys(`posts:thread:${threadId}*`);
        if (keys.length) await Promise.all(keys.map(k => redis.del(k)));
        await redis.del(`thread:${threadId}`);
      }
    } catch (cacheErr) {
      console.error('Redis DEL error (posts update)', cacheErr);
    }

    return res.json(updatedRows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

// DELETE /api/posts/:id - delete a post (owner or admin)

// POST /api/posts/:id/like - like a post (one per user)
router.post('/:id/like', auth, async (req, res) => {
  const id = req.params.id;
  const userId = req.user && req.user.user_id;
  if (!id) return res.status(400).json({ status: false, message: 'id is required' });
  if (!userId) return res.status(401).json({ status: false, message: 'Invalid user' });

  try {
    // ensure posts_likes table exists (safe to run)
    await pool.query(`CREATE TABLE IF NOT EXISTS posts_likes (id BIGINT AUTO_INCREMENT PRIMARY KEY, post_id BIGINT NOT NULL, user_id BIGINT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY (post_id, user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // attempt to insert like; ignore duplicate key
    try {
      await pool.query('INSERT INTO posts_likes (post_id, user_id) VALUES (?, ?)', [id, userId]);
      // increment posts.like_count
      await pool.query('UPDATE posts SET like_count = IFNULL(like_count,0) + 1 WHERE post_id = ?', [id]);
    } catch (e) {
      // duplicate key (already liked) -> idempotent
      if (e && e.code === 'ER_DUP_ENTRY') {
        // already liked, return 200
        const [row] = await pool.query('SELECT like_count FROM posts WHERE post_id = ? LIMIT 1', [id]);
        return res.json({ status: true, like_count: (row && row[0] && row[0].like_count) || 0 });
      }
      throw e;
    }

    // return current like_count
    const [rows] = await pool.query('SELECT like_count FROM posts WHERE post_id = ? LIMIT 1', [id]);
    // invalidate caches
    try { await redis.del(`post:${id}`); } catch (e) { /* ignore */ }
    return res.status(201).json({ status: true, like_count: (rows && rows[0] && rows[0].like_count) || 0 });
  } catch (err) {
    console.error('Like error', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

// DELETE /api/posts/:id/like - remove like
router.delete('/:id/like', auth, async (req, res) => {
  const id = req.params.id;
  const userId = req.user && req.user.user_id;
  if (!id) return res.status(400).json({ status: false, message: 'id is required' });
  if (!userId) return res.status(401).json({ status: false, message: 'Invalid user' });

  try {
    const [del] = await pool.query('DELETE FROM posts_likes WHERE post_id = ? AND user_id = ?', [id, userId]);
    if (del && del.affectedRows) {
      await pool.query('UPDATE posts SET like_count = GREATEST(IFNULL(like_count,0) - 1, 0) WHERE post_id = ?', [id]);
    }
    const [rows] = await pool.query('SELECT like_count FROM posts WHERE post_id = ? LIMIT 1', [id]);
    try { await redis.del(`post:${id}`); } catch (e) { /* ignore */ }
    return res.json({ status: true, like_count: (rows && rows[0] && rows[0].like_count) || 0 });
  } catch (err) {
    console.error('Unlike error', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});
router.delete('/:id', auth, async (req, res) => {
  const id = req.params.id;
  const userId = req.user && req.user.user_id;
  if (!id) return res.status(400).json({ status: false, message: 'id is required' });
  if (!userId) return res.status(401).json({ status: false, message: 'Invalid user' });

  try {
    const [rows] = await pool.query('SELECT post_id, user_id, thread_id FROM posts WHERE post_id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ status: false, message: 'Post not found' });
    const ownerId = rows[0].user_id;
    const threadId = rows[0].thread_id;

    // allow if post owner, thread owner, or admin
    let isAdmin = false;
    if (req.user && req.user.role && String(req.user.role).toLowerCase() === 'admin') isAdmin = true;
    if (!isAdmin) {
      const role = await resolveUserRole(userId);
      if (role && String(role).toLowerCase() === 'admin') isAdmin = true;
    }

    // fetch thread owner
    let threadOwnerId = null;
    try {
      const [trows] = await pool.query('SELECT user_id FROM threads WHERE thread_id = ? LIMIT 1', [threadId]);
      if (trows && trows.length) threadOwnerId = trows[0].user_id;
    } catch (e) {
      console.error('Failed to fetch thread owner', e);
    }

    if (Number(ownerId) !== Number(userId) && Number(threadOwnerId) !== Number(userId) && !isAdmin) {
      return res.status(403).json({ status: false, message: 'Forbidden. Only post owner, thread owner, or admin can delete.' });
    }

    // delete the post
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // if there are dependent tables referencing posts, delete them here
      await conn.query('DELETE FROM posts WHERE post_id = ?', [id]);
      await conn.commit();
      conn.release();

      // invalidate caches
      try {
        await redis.del(`post:${id}`);
        if (threadId) {
          const keys = await redis.keys(`posts:thread:${threadId}*`);
          if (keys.length) await Promise.all(keys.map(k => redis.del(k)));
          await redis.del(`thread:${threadId}`);
        }
      } catch (cacheErr) {
        console.error('Redis DEL error (posts delete)', cacheErr);
      }

      return res.json({ status: true });
    } catch (txErr) {
      try { await conn.rollback(); } catch (e) { /* ignore */ }
      try { conn.release(); } catch (e) { /* ignore */ }
      console.error('Delete post transaction error', txErr);
      return res.status(500).json({ status: false, message: 'Failed to delete post' });
    }
  } catch (err) {
    console.error('Delete post error', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

module.exports = router;

