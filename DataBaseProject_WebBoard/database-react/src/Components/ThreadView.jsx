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
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    // API base (normalize trailing slash)
    const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:8080').replace(/\/$/, '');
    const [likedPostIds, setLikedPostIds] = useState(new Set());

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

    // load posts for this thread
    useEffect(() => {
        let mounted = true;
        async function fetchPosts() {
            setPostsLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/posts?thread_id=${encodeURIComponent(id)}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (!mounted) return;
                // normalize avatar_url: if starts with /uploads ensure full URL
                const normalized = (Array.isArray(data) ? data : []).map(p => {
                    if (p && p.avatar_url && p.avatar_url.startsWith('/uploads')) {
                        return { ...p, avatar_url: API_BASE + p.avatar_url };
                    }
                    return p;
                });
                setPosts(normalized);
                // if user logged in, check which posts are liked by this user
                if (token) {
                    try {
                        const checks = normalized.map(p => fetch(`${API_BASE}/api/posts/${encodeURIComponent(p.post_id)}/liked`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json().catch(() => null)));
                        const results = await Promise.all(checks);
                        const liked = new Set();
                        results.forEach((r, i) => { if (r && r.liked) liked.add(String(normalized[i].post_id)); });
                        setLikedPostIds(liked);
                    } catch (e) { /* ignore */ }
                }
            } catch (e) {
                console.error('Failed to load posts', e);
                if (mounted) setPosts([]);
            } finally {
                if (mounted) setPostsLoading(false);
            }
        }
        if (id) fetchPosts();
        return () => { mounted = false; };
    }, [id]);

    const canEdit = user && Number(user.user_id || user.id) === Number(thread && thread.user_id);
    const canReport = user && !(Number(user.user_id || user.id) === Number(thread && thread.user_id));
    const [reportOpen, setReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportLoading, setReportLoading] = useState(false);
        const [reportMessage, setReportMessage] = useState('');

        // like a post (simple increment). Server accepts updating like_count via PUT /api/posts/:id
        async function handleLike(postId) {
            try {
                if (!token) return alert('Please login to like');
                if (likedPostIds.has(String(postId))) return; // already liked in this session
                const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
                const res = await fetch(`${API_BASE}/api/posts/${encodeURIComponent(postId)}/like`, { method: 'POST', headers });
                const json = await res.json().catch(() => null);
                if (!res.ok) {
                    console.error('Like failed', json);
                    return;
                }
                // update post like_count and mark liked
                setPosts(prev => prev.map(p => (Number(p.post_id) === Number(postId) ? { ...p, like_count: json.like_count || (p.like_count||0) } : p)));
                setLikedPostIds(s => new Set(Array.from(s).concat(String(postId))));
            } catch (err) {
                console.error('Like error', err);
            }
        }

    async function deleteThread() {
        if (!window.confirm('Delete this thread? This cannot be undone.')) return;
        try {
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`${API_BASE}/api/threads/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
            if (!res.ok) {
                let body = null;
                try { body = await res.json(); } catch (e) { body = await res.text().catch(() => null); }
                const msg = body && body.message ? body.message : (typeof body === 'string' ? body : `HTTP ${res.status}`);
                alert('Failed to delete thread: ' + msg);
                return;
            }
            // success — navigate back to home
            navigate('/');
        } catch (e) {
            console.error('Delete thread failed', e);
            alert('Failed to delete thread: ' + (e.message || e));
        }
    }

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
                                    <>
                                        <button className="tv-btn" onClick={() => setEditMode((s) => !s)}>{editMode ? 'Cancel' : 'Edit'}</button>
                                        <button className="tv-btn tv-btn-danger" onClick={deleteThread} style={{ marginLeft: 8 }}>Delete</button>
                                    </>
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
                        
                        <section className="tv-posts">
                            <h3>Replies</h3>
                            {postsLoading ? (
                                <div className="tv-empty">Loading replies...</div>
                            ) : posts.length === 0 ? (
                                <div className="tv-empty">No replies yet. Be the first to reply.</div>
                            ) : (
                                posts.map(p => (
                                    <div key={p.post_id} className="tv-post">
                                        <div className="tv-post-left">
                                            {p.avatar_url ? (
                                                <img src={p.avatar_url} alt={p.username || 'avatar'} className="tv-avatar-img" />
                                            ) : (
                                                <div className="tv-avatar">{(p.username || 'U').charAt(0).toUpperCase()}</div>
                                            )}
                                        </div>
                                        <div className="tv-post-body">
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div className="tv-post-author">{p.username || 'Unknown'}</div>
                                                    <div className="tv-post-time tv-muted">{p.created_at ? new Date(p.created_at).toLocaleString() : ''}</div>
                                                </div>
                                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <button className="tv-like-button" onClick={() => handleLike(p.post_id)} title="Like" disabled={likedPostIds.has(String(p.post_id))}>{likedPostIds.has(String(p.post_id)) ? '♥' : '❤'}</button>
                                                    <div className="tv-like-count">{p.like_count || 0}</div>
                                                </div>
                                            </div>
                                            <div className="tv-post-content" style={{ marginTop: 6 }}>{p.content}</div>
                                        </div>
                                    </div>
                                ))
                            )}

                            <div className="tv-new-post">
                                {user ? (
                                    <>
                                        <textarea className="tv-textarea" rows={4} value={newPostContent} onChange={e => setNewPostContent(e.target.value)} placeholder="Write a reply..." />
                                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                            <button className="tv-btn tv-btn-primary" onClick={async () => {
                                                if (!newPostContent || !newPostContent.trim()) return alert('Please enter a message');
                                                try {
                                                    const headers = { 'Content-Type': 'application/json' };
                                                    if (token) headers['Authorization'] = `Bearer ${token}`;
                                                    const res = await fetch(`${API_BASE}/api/posts`, { method: 'POST', headers, body: JSON.stringify({ thread_id: id, content: newPostContent }) });
                                                    let json = null;
                                                    try { json = await res.json(); } catch (e) { /* ignore */ }
                                                    if (!res.ok) {
                                                        alert((json && json.message) ? json.message : `Request failed (${res.status})`);
                                                        return;
                                                    }
                                                    // normalize avatar_url on the new post then append
                                                    if (json && json.avatar_url && json.avatar_url.startsWith('/uploads')) {
                                                        json.avatar_url = API_BASE + json.avatar_url;
                                                    }
                                                    setPosts(prev => ([ ...prev, json ]));
                                                    setNewPostContent('');
                                                } catch (err) {
                                                    console.error('Create post failed', err);
                                                    alert('Failed to create post');
                                                }
                                            }}>Reply</button>
                                            <button className="tv-btn" onClick={() => setNewPostContent('')}>Cancel</button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="tv-muted">You must be logged in to reply.</div>
                                )}
                            </div>
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
