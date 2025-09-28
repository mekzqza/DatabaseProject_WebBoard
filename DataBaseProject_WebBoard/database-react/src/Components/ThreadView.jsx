import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getThreadById, updateThread } from './APIs/ThreadsApi';
import { useAuth } from './AuthProvider';
import './CssStore/forumDashboard.css';

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

    return (
        <div className="fd-page">
            <button className="fd-btn fd-home-tab" onClick={() => navigate('/')}>Home</button>
            <main className="fd-container">
                {loading ? (
                    <div>Loading...</div>
                ) : error ? (
                    <div>Error: {error}</div>
                ) : !thread ? (
                    <div>Thread not found</div>
                ) : (
                    <article className="fd-thread-view">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className="fd-recent-title">{thread.title}</h2>
                            {user && Number(user.user_id || user.id) === Number(thread.user_id) && (
                                <div>
                                    <button className="fd-btn" onClick={() => setEditMode((s) => !s)}>{editMode ? 'Cancel' : 'Edit'}</button>
                                </div>
                            )}
                        </div>
                        <div className="fd-recent-meta">
                            <span className="fd-recent-cat">{thread.categoryTitle || thread.category || 'General'}</span>
                            <span className="fd-recent-author">by {thread.author || thread.username || 'Unknown'}</span>
                            <span className="fd-recent-time">{thread.createdAt ? new Date(thread.createdAt).toLocaleString() : ''}</span>
                        </div>
                        {editMode ? (
                            <div style={{ marginTop: 12 }}>
                                <div style={{ marginBottom: 8 }}>
                                    <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ width: '100%', padding: 8 }} />
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8} style={{ width: '100%', padding: 8 }} />
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="fd-btn fd-btn-primary" onClick={async () => {
                                        try {
                                            const payload = { title: form.title, content: form.content, category_id: form.category_id };
                                            const updated = await updateThread(id, payload, token);
                                            setThread(updated);
                                            setEditMode(false);
                                            // optional: refresh parent lists by navigating or emitting event
                                        } catch (e) {
                                            alert('Failed to update thread: ' + (e.message || e));
                                        }
                                    }}>Save</button>
                                    <button className="fd-btn" onClick={() => setEditMode(false)}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ marginTop: 12 }} dangerouslySetInnerHTML={{ __html: thread.content || thread.body || '' }} />
                        )}
                    </article>
                )}
            </main>
        </div>
    );
}
