import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function ThreadsReports() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRaw, setShowRaw] = useState(false);
  const [lastFetchStatus, setLastFetchStatus] = useState(null);
  const [lastFetchBody, setLastFetchBody] = useState('');

  const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:8080').replace(/\/$/, '');

  // small helper to format timestamps returned from API
  function formatTimestamp(raw) {
    // raw may be: null, ISO string, unix seconds (number), unix ms (number), or undefined
    if (raw === null || raw === undefined) return '';
    let ts = raw;
    // if object with known fields, try to pick common names
    if (typeof raw === 'object') {
      ts = raw.reported_at || raw.created_at || raw.createdAt || raw.timestamp || raw.time || raw;
    }
    // if numeric and likely seconds (10 digits), convert to ms
    if (typeof ts === 'number') {
      if (ts > 0 && ts < 1e11) ts = ts * 1000; // seconds -> ms
    }
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return String(raw);
      return d.toLocaleString();
    } catch (e) {
      return String(raw);
    }
  }

  // derive role (from auth provider or localStorage fallback)
  const derivedRole = (user && user.role) || (() => {
    try {
      const raw = sessionStorage.getItem('user');
      if (raw) return JSON.parse(raw).role;
    } catch (e) { }
    return null;
  })();

  // redirect non-admins once role is known
  useEffect(() => {
    if (derivedRole === null) return; // still determining
    if (String(derivedRole).toLowerCase() !== 'admin') {
      // don't immediately navigate away while debugging — show debug info briefly
      // NOTE: in production this should redirect right away
      console.warn('Non-admin tried to access reports page, role=', derivedRole);
      // navigate('/');
    }
  }, [derivedRole, navigate]);

  useEffect(() => {
    // only fetch when user is confirmed admin
    if (String(derivedRole).toLowerCase() !== 'admin') return;
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/api/reports`, { headers });
        if (!res.ok) {
          // try get json error, otherwise text
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j && j.message ? j.message : `HTTP ${res.status}`);
          }
          const text = await res.text().catch(() => '');
          throw new Error(text || `HTTP ${res.status}`);
        }
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          const txt = await res.text().catch(() => '');
          throw new Error(txt || 'Unexpected non-JSON response from API');
        }
        const data = await res.json();
        if (!mounted) return;
        setReports(data || []);
      } catch (e) {
        console.error('Failed to load reports', e);
        if (mounted) setError(e.message || 'Failed to load reports');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [token, derivedRole]);

  async function updateStatus(reportId, status) {
    try {
      const res = await fetch(`${API_BASE}/api/reports/${encodeURIComponent(reportId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j && j.message ? j.message : `HTTP ${res.status}`);
      }
      // update local state
      setReports(r => r.map(x => x.report_id === reportId ? { ...x, status } : x));
    } catch (e) {
      alert('Failed to update status: ' + (e.message || e));
    }
  }

    async function deleteThread(threadId) {
      if (!window.confirm('Delete this thread? This action cannot be undone.')) return;
      try {
        const res = await fetch(`${API_BASE}/api/threads/${encodeURIComponent(threadId)}`, {
          method: 'DELETE',
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j && j.message ? j.message : `HTTP ${res.status}`);
        }
        // refresh list
        manualLoad();
        alert('Thread deleted');
      } catch (e) {
        alert('Failed to delete thread: ' + (e.message || e));
      }
    }

  async function manualLoad() {
    setLoading(true); setError(''); setLastFetchStatus(null); setLastFetchBody('');
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/reports`, { headers });
      setLastFetchStatus(`${res.status} ${res.statusText}`);
      const text = await res.text().catch(() => '');
      setLastFetchBody(text);
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      const data = JSON.parse(text || '[]');
      setReports(data || []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Thread Reports (Admin)</h2>
      {/* Debug summary (temporary) */}
  <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: '#fff', color: '#071328', border: '1px solid rgba(2,6,23,0.06)', boxShadow: '0 6px 18px rgba(2,6,23,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>Debug (temporary)</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 220 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#071328' }}>{user ? (user.username || user.email || ('#' + user.user_id)) : '—'}</div>
                <div style={{ marginTop: 4, color: '#446', fontSize: 13 }}>{user && user.email ? user.email : ''}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>Role: <strong style={{ color: '#9fe' }}>{String(derivedRole)}</strong></div>
                <div>UID: <code style={{ background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: 4 }}>{user ? user.user_id : '—'}</code></div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
        <button id="debug-toggle-raw" onClick={() => setShowRaw(s => !s)} style={{ marginRight: 8 }}>{showRaw ? 'Hide raw' : 'Show raw'}</button>
        <button onClick={() => manualLoad()} style={{ marginRight: 8 }}>Load reports</button>
        <button onClick={() => window.location.reload()}>Refresh</button>
          </div>
        </div>
        <div style={{ marginTop: 8, color: '#cce' }}>
          Token: <code style={{ wordBreak: 'break-all' }}>{token ? `${String(token).slice(0,24)}...${String(token).slice(-6)}` : '—'}</code>
        </div>
        {/** raw detail toggle area */}
        {showRaw && (
          <div style={{ marginTop: 8, background: '#010610', padding: 8, borderRadius: 6, maxHeight: 180, overflow: 'auto' }}>
            <div><strong>Raw user object</strong></div>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(user, null, 2)}</pre>
            <div style={{ marginTop: 8 }}><strong>localStorage.user</strong></div>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{sessionStorage.getItem('user')}</pre>
            <div style={{ marginTop: 8 }}><strong>raw token</strong></div>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{String(token)}</pre>
          </div>
        )}
        {lastFetchStatus && (
          <div style={{ marginTop: 8, color: '#cff' }}>
            <div><strong>Last fetch:</strong> {lastFetchStatus}</div>
            <div style={{ marginTop: 6, maxHeight: 140, overflow: 'auto', background: '#00101a', padding: 8, borderRadius: 6 }}><pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#cfe' }}>{lastFetchBody}</pre></div>
          </div>
        )}
      </div>

      {loading ? (<div>Loading...</div>) : error ? (<div style={{ color: 'red' }}>{error}</div>) : (
        <div>
          {reports.length === 0 ? (
            <div>No reports found</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>#</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Thread</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Reporter</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Reason</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>When</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.report_id} style={{ borderTop: '1px solid #eee', background: '#ffffff', color: '#071328' }}>
                    <td style={{ padding: 12, verticalAlign: 'top', width: 60 }}>{r.report_id}</td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 700, color: '#071328' }}>{r.thread_title || `#${r.thread_id}`}</div>
                      <div style={{ color: '#666', marginTop: 6 }}>id: {r.thread_id} • by: {r.thread_author_username || 'unknown'}</div>
                      {r.thread_content && (
                        <div style={{ marginTop: 8, color: '#444', maxWidth: 800, whiteSpace: 'pre-wrap' }}>{String(r.thread_content).slice(0, 240)}{String(r.thread_content).length > 240 ? '…' : ''}</div>
                      )}
                    </td>
                    <td style={{ padding: 12, verticalAlign: 'top' }}>{r.reporter_username || r.user_id}</td>
                    <td style={{ padding: 12, maxWidth: 400, whiteSpace: 'pre-wrap', verticalAlign: 'top' }}>{r.reason}</td>
                    <td style={{ padding: 12, verticalAlign: 'top' }}>{r.status}</td>
                    <td style={{ padding: 12, verticalAlign: 'top' }} title={r.report_created_at || r.created_at}>{formatTimestamp(r.report_created_at || r.created_at)}</td>
                    <td style={{ padding: 12, verticalAlign: 'top' }}>
                      <button onClick={() => navigate(`/thread/${r.thread_id}`)} style={{ marginRight: 8 }}>View</button>
                      {r.status !== 'resolved' && <button onClick={() => updateStatus(r.report_id, 'resolved')}>Resolve</button>}
                      {r.status !== 'reviewed' && <button onClick={() => updateStatus(r.report_id, 'reviewed')} style={{ marginLeft: 8 }}>Mark Reviewed</button>}
                      {String(derivedRole).toLowerCase() === 'admin' && (
                        <button onClick={() => deleteThread(r.thread_id)} style={{ marginLeft: 12, background: '#c33', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: 4 }}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
