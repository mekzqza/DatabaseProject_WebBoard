import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getThreadById, updateThread } from './APIs/ThreadsApi';
import { useAuth } from './AuthProvider';
import './CssStore/forumDashboard.css';
import './CssStore/threadView.css';

export default function ThreadView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [thread, setThread] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user, token } = useAuth();
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ title: '', content: '', category_id: null });

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError('');
        getThreadById(id).then(data => {
            if (!mounted) return;
            setThread(data);
            setForm({ title: data.title || '', content: data.content || '', category_id: data.category_id ?? data.categoryId ?? null });
        }).catch(err => {
            console.error('Failed to load thread', err);
            if (mounted) setError(err.message || 'Failed to load thread');
        }).finally(() => {
            if (mounted) setLoading(false);
        });
        return () => { mounted = false; };
    }, [id]);

    const canEdit = user && Number(user.user_id || user.id) === Number(thread && thread.user_id);
    const canReport = user && !(Number(user.user_id || user.id) === Number(thread && thread.user_id));
    const [reportOpen, setReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [reportMessage, setReportMessage] = useState('');
    const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:8080').replace(/\/$/, '');

    return (
        <div className="tv-page">
            <button className="tv-home-btn" onClick={() => navigate('/')}>Home</button>
            <main className="tv-container">
                {loading ? (
                    <div className="tv-empty">Loading...</div>
                ) : error ? (
                    <div className="tv-empty tv-error">Error: {error}</div>
                ) : !thread ? (
                    <div className="tv-empty">Thread not found</div>
                ) : (
                    <article className="tv-card">
                        <header className="tv-header">
                            <div className="tv-title-wrap">
                                <h1 className="tv-title">{thread.title}</h1>
                                <div className="tv-sub">{thread.categoryTitle || thread.category || 'General'}</div>
                            </div>
                            <div className="tv-actions">
                                {canEdit && (
                                    <button className="tv-btn" onClick={() => setEditMode((s) => !s)}>{editMode ? 'Cancel' : 'Edit'}</button>
                                )}
                                {canReport && (
                                    <button className="tv-btn" onClick={() => { setReportOpen(true); setReportMessage(''); setReportReason(''); }}>Report</button>
                                )}
                            </div>
                        </header>

                        <div className="tv-meta">
                            <div className="tv-meta-left">
                                <div className="tv-avatar" aria-hidden> { (thread.author || thread.username || 'U').charAt(0).toUpperCase() } </div>
                                <div>
                                    <div className="tv-author">{thread.author || thread.username || 'Unknown'}</div>
                                    <div className="tv-time">{thread.createdAt ? new Date(thread.createdAt).toLocaleString() : ''}</div>
                                </div>
                            </div>
                        </div>

                        <section className="tv-body">
                            {editMode ? (
                                <div className="tv-edit-form">
                                    <input className="tv-input" type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                                    <textarea className="tv-textarea" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={10} />
                                    <div className="tv-form-actions">
                                        <button className="tv-btn tv-btn-primary" onClick={async () => {
                                            try {
                                                const payload = { title: form.title, content: form.content, category_id: form.category_id };
                                                const updated = await updateThread(id, payload, token);
                                                setThread(updated);
                                                setEditMode(false);
                                            } catch (e) {
                                                alert('Failed to update thread: ' + (e.message || e));
                                            }
                                        }}>Save</button>
                                        <button className="tv-btn" onClick={() => setEditMode(false)}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="tv-content" dangerouslySetInnerHTML={{ __html: thread.content || thread.body || '' }} />
                            )}
                        </section>
                        {/* report modal */}
                        {reportOpen && (
                            <div className="tv-report-modal" role="dialog">
                                <div className="tv-report-box">
                                    <h3>Report Thread</h3>
                                    <p className="tv-muted">Use this form to report content that violates the rules.</p>
                                    <textarea className="tv-textarea" rows={5} value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Reason (optional)" />
                                    {reportMessage && <div className="tv-report-msg">{reportMessage}</div>}
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                        <button className="tv-btn tv-btn-primary" disabled={reportLoading} onClick={async () => {
                                            try {
                                                setReportLoading(true);
                                                setReportMessage('');
                                                const url = `${API_BASE}/api/reports`;
                                                const headers = { 'Content-Type': 'application/json' };
                                                if (token) headers['Authorization'] = `Bearer ${token}`;
                                                const res = await fetch(url, {
                                                    method: 'POST',
                                                    headers,
                                                    body: JSON.stringify({ thread_id: id, reason: reportReason })
                                                });
                                                let json = null;
                                                try { json = await res.json(); } catch (e) { /* ignore */ }
                                                if (!res.ok) {
                                                    setReportMessage(json && json.message ? json.message : `Request failed (${res.status})`);
                                                } else {
                                                    setReportMessage('Report submitted');
                                                    setTimeout(() => setReportOpen(false), 1000);
                                                }
                                            } catch (err) {
                                                console.error('Report failed', err);
                                                setReportMessage('Network error');
                                            } finally { setReportLoading(false); }
                                        }}>Send</button>
                                        <button className="tv-btn" onClick={() => setReportOpen(false)}>Close</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </article>
                )}
            </main>
        </div>
    );
}
