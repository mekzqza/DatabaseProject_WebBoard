const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const REPORTS_TABLE = process.env.REPORTS_TABLE || 'reports';

// helper admin guard
async function requireAdmin(req, res, next) {
  try {
    let role = req.user && req.user.role;
    // if JWT doesn't include role, fetch from DB using user_id
    if ((!role || role === '') && req.user && req.user.user_id) {
      const [rows] = await pool.query('SELECT role FROM users WHERE user_id = ? LIMIT 1', [req.user.user_id]);
      if (rows && rows.length > 0) role = rows[0].role;
    }
    if (!role || String(role).toLowerCase() !== 'admin') {
      return res.status(403).json({ status: false, message: 'Admin required' });
    }
    next();
  } catch (e) {
    console.error('requireAdmin error', e);
    return res.status(500).json({ status: false, message: 'Server error' });
  }
}

// POST /api/reports - create a new report (requires auth)
router.post('/', auth, async (req, res) => {
  const reporterId = req.user && req.user.user_id;
  const { thread_id, reason } = req.body || {};
  if (!reporterId) return res.status(401).json({ status: false, message: 'Authentication required' });
  if (!thread_id) return res.status(400).json({ status: false, message: 'thread_id is required' });
  try {
    const reporterIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || null;
    const userAgent = req.get('User-Agent') || null;
    console.log('Report request from user:', reporterId, 'thread_id:', thread_id, 'hasAuthHeader:', !!req.headers.authorization, 'ip:', reporterIp);
    // verify thread exists
    const [[threadRow]] = await pool.query('SELECT thread_id FROM threads WHERE thread_id = ? LIMIT 1', [thread_id]);
    if (!threadRow) return res.status(404).json({ status: false, message: 'Thread not found' });

    // prevent duplicate report by same user for same thread
    const [existing] = await pool.query(`SELECT report_id FROM \`${REPORTS_TABLE}\` WHERE thread_id = ? AND user_id = ? LIMIT 1`, [thread_id, reporterId]);
    if (existing && existing.length > 0) {
      return res.status(409).json({ status: false, message: 'You already reported this thread' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const now = new Date();
      // insert including reporter ip and user agent if table has those columns
      // Try inserting with reporter_ip and user_agent if the table has those columns.
      let result;
      try {
        const insertSql = `INSERT INTO \`${REPORTS_TABLE}\` (thread_id, user_id, reason, status, reporter_ip, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        [result] = await conn.query(insertSql, [thread_id, reporterId, reason || null, 'pending', reporterIp, userAgent, now]);
      } catch (insertErr) {
        // If the table doesn't have reporter_ip/user_agent, retry a simpler insert
        const msg = insertErr && insertErr.message ? insertErr.message.toLowerCase() : '';
        if (msg.includes("unknown column 'reporter_ip'") || msg.includes("unknown column \"reporter_ip\"") || msg.includes('unknown column') ) {
          console.warn('Reports table missing reporter_ip/user_agent columns, retrying simpler insert');
          const insertSql2 = `INSERT INTO \`${REPORTS_TABLE}\` (thread_id, user_id, reason, status, created_at) VALUES (?, ?, ?, ?, ?)`;
          [result] = await conn.query(insertSql2, [thread_id, reporterId, reason || null, 'pending', now]);
        } else {
          throw insertErr;
        }
      }
      await conn.commit();
      conn.release();
      return res.status(201).json({ status: true, report_id: result.insertId, user_id: reporterId });
    } catch (txErr) {
      await conn.rollback();
      conn.release();
      console.error('Create report tx error', txErr && txErr.stack ? txErr.stack : txErr);
      const msg = (process.env.NODE_ENV === 'production') ? 'Failed to create report' : (txErr && txErr.message ? txErr.message : 'Failed to create report');
      return res.status(500).json({ status: false, message: msg });
    }
  } catch (err) {
    console.error('Create report error', err && err.stack ? err.stack : err);
    const msg = (process.env.NODE_ENV === 'production') ? 'Failed to create report' : (err && err.message ? err.message : 'Failed to create report');
    return res.status(500).json({ status: false, message: msg });
  }
});

// GET /api/reports - list reports (admin only)
// optional query: status, limit, offset
router.get('/', auth, requireAdmin, async (req, res) => {
  const status = req.query.status;
  const limit = Math.min(100, Number(req.query.limit || 50));
  const offset = Number(req.query.offset || 0);
  try {
  const table = REPORTS_TABLE || 'reports';
  // Select report fields, reporter info, and thread details (title, content, author info)
  let sql = `SELECT r.report_id,
        r.thread_id,
        r.user_id AS reporter_user_id,
        r.reason,
        r.status,
        r.created_at AS report_created_at,
        reporter.username AS reporter_username,
        t.title AS thread_title,
        t.content AS thread_content,
        t.user_id AS thread_user_id,
        t.created_at AS thread_created_at,
        t.updated_at AS thread_updated_at,
        thread_author.username AS thread_author_username
       FROM ${table} r
       LEFT JOIN users reporter ON reporter.user_id = r.user_id
       LEFT JOIN threads t ON t.thread_id = r.thread_id
       LEFT JOIN users thread_author ON thread_author.user_id = t.user_id`;
    const params = [];
    if (status) {
      sql += ' WHERE r.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error('List reports error', err);
    return res.status(500).json({ status: false, message: 'Failed to list reports' });
  }
});

// GET /api/reports/:id - get a single report (admin only)
router.get('/:id', auth, requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
  const table = REPORTS_TABLE || 'reports';
  const q = `SELECT r.report_id,
            r.thread_id,
            r.user_id AS reporter_user_id,
            r.reason,
            r.status,
            r.created_at AS report_created_at,
            reporter.username AS reporter_username,
            t.title AS thread_title,
            t.content AS thread_content,
            t.user_id AS thread_user_id,
            t.created_at AS thread_created_at,
            t.updated_at AS thread_updated_at,
            thread_author.username AS thread_author_username
         FROM ${table} r
         LEFT JOIN users reporter ON reporter.user_id = r.user_id
         LEFT JOIN threads t ON t.thread_id = r.thread_id
         LEFT JOIN users thread_author ON thread_author.user_id = t.user_id
         WHERE r.report_id = ? LIMIT 1`;
  const [rows] = await pool.query(q, [id]);
  if (!rows || rows.length === 0) return res.status(404).json({ status: false, message: 'Report not found' });
  return res.json(rows[0]);
  } catch (err) {
    console.error('Get report error', err);
    return res.status(500).json({ status: false, message: 'Failed to fetch report' });
  }
});

// PUT /api/reports/:id - update report (admin only)
// body: { status, reason }
router.put('/:id', auth, requireAdmin, async (req, res) => {
  const id = req.params.id;
  const { status, reason } = req.body || {};
  const fields = [];
  const params = [];
  if (status) { fields.push('status = ?'); params.push(status); }
  if (reason !== undefined) { fields.push('reason = ?'); params.push(reason); }
  if (fields.length === 0) return res.status(400).json({ status: false, message: 'No updatable fields provided' });
  params.push(id);
  const table = REPORTS_TABLE || 'reports';
  const sql = `UPDATE ${table} SET ${fields.join(', ')} WHERE report_id = ?`;
  try {
    const [result] = await pool.query(sql, params);
    return res.json({ status: true, affectedRows: result.affectedRows });
  } catch (err) {
    console.error('Update report error', err);
    return res.status(500).json({ status: false, message: 'Failed to update report' });
  }
});

module.exports = router;
