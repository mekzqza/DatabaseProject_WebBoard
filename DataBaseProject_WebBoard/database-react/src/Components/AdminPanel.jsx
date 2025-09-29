import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import './CssStore/admin-panel.css';

export default function AdminPanel() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [q, setQ] = useState('');

    // guard: only admin can access
    useEffect(() => {
        if (!user) return; // wait for auth initialization
        const role = String(user.role || '').toLowerCase();
        if (role !== 'admin') {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            setError('');
            try {
                const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:8080').replace(/\/$/, '');
                const headers = { 'Accept': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;
                const res = await fetch(`${apiBase}/api/users`, { headers });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                if (!mounted) return;
                setUsers(Array.isArray(json) ? json : []);
            } catch (e) {
                console.error('Failed to load users', e);
                if (mounted) setError('Failed to load users');
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [token]);

    const [saving, setSaving] = useState(null);

    const filtered = useMemo(() => {
        const term = (q || '').toLowerCase().trim();
        if (!term) return users;
        return users.filter(u => (u.username || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term));
    }, [users, q]);

    return (
        <div className="admin-page">
            <header className="admin-header">
                <h1>Admin Panel</h1>
                {user && String(user.role || '').toLowerCase() === 'admin' && (
                    <div style={{ marginLeft: 'auto' }}>
                        <button className="fd-btn" onClick={() => navigate('/threads-reports')} style={{ background: '#111827', color: 'white' }}>Thread Reports</button>
                    </div>
                )}
            </header>

            <main className="admin-main">
                <div className="admin-controls">
                    <input className="admin-search" placeholder="Search username or email..." value={q} onChange={e => setQ(e.target.value)} />
                </div>

                {loading ? <div>Loading users...</div> : error ? <div className="admin-error">{error}</div> : (
                    <table className="admin-table">
                        <thead>
                            <tr><th>Username</th><th>Email</th><th>Role</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u.user_id || u.id || u.email}>
                                    <td style={{ width: '35%' }}>{u.username}</td>
                                    <td style={{ width: '45%' }}>{u.email}</td>
                                    <td style={{ width: '20%' }}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <select defaultValue={u.role || 'user'} onChange={(e) => {
                                                // optimistic UI: update local users array
                                                const val = e.target.value;
                                                setUsers(prev => prev.map(x => x.user_id === u.user_id ? { ...x, role: val } : x));
                                            }}>
                                                <option value="user">user</option>
                                                <option value="moderator">moderator</option>
                                                <option value="admin">admin</option>
                                            </select>
                                            <button className="fd-btn" onClick={async () => {
                                                try {
                                                    setSaving(u.user_id);
                                                    const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:8080').replace(/\/$/, '');
                                                    const headers = { 'Content-Type': 'application/json' };
                                                    const tokenVal = (user && user.token) || sessionStorage.getItem('token');
                                                    if (tokenVal) headers['Authorization'] = `Bearer ${tokenVal}`;
                                                    const res = await fetch(`${apiBase}/api/users/${encodeURIComponent(u.user_id)}/role`, {
                                                        method: 'PUT', headers, body: JSON.stringify({ role: u.role || 'user' })
                                                    });
                                                    if (!res.ok) {
                                                        const body = await res.json().catch(() => null);
                                                        throw new Error((body && body.message) ? body.message : `HTTP ${res.status}`);
                                                    }
                                                    // success — leave local state as-is
                                                } catch (e) {
                                                    console.error('Failed to update role', e);
                                                    alert('Failed to update role: ' + (e.message || e));
                                                } finally { setSaving(null); }
                                            }} disabled={saving === u.user_id}>{saving === u.user_id ? 'Saving...' : 'Save'}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </main>
        </div>
    );
}
