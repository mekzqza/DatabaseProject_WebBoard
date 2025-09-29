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

    const filtered = useMemo(() => {
        const term = (q || '').toLowerCase().trim();
        if (!term) return users;
        return users.filter(u => (u.username || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term));
    }, [users, q]);

    return (
        <div className="admin-page">
            <header className="admin-header">
                <h1>Admin Panel</h1>
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
                                    <td>{u.username}</td>
                                    <td>{u.email}</td>
                                    <td>{u.role || ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </main>
        </div>
    );
}
