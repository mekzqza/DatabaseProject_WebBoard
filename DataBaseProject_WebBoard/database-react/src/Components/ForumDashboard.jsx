import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import NewThreadModal from "./NewThreadModel";
import "./CssStore/forumDashboard.css";
import { useAuth } from './AuthProvider';
import ProfilePopup from './ProfilePopup';
import { getThreads, createThread } from './APIs/ThreadsApi';

const initialStats = [
    // initialize total threads to 0 — we'll update from the API on mount
    { id: 1, icon: "Chat", value: 0, label: "Total Threads", color: "var(--blue-50)" },
    // Members value will be replaced by the real user count from the backend
    { id: 2, icon: "Members", value: 0, label: "Active Members", color: "var(--green-50)" },
];

const initialCategories = [
    { id: 1, title: "General Discussion", desc: "Talk about anything and everything", threads: 0, dot: "var(--blue-500)" },
    { id: 2, title: "Technology", desc: "Latest tech news and discussions", threads: 0, dot: "var(--green-500)" },
    { id: 3, title: "Help & Support", desc: "Get help from the community", threads: 0, dot: "var(--orange-500)" },
    { id: 4, title: "Announcements", desc: "Important updates and news", threads: 0, dot: "var(--purple-500)" },
];

export default function ForumDashboard() {
    // make stats writable so we can update the Total Threads value
    const [stats, setStats] = useState(initialStats);
    const [categories, setCategories] = useState(initialCategories);
    const categoriesRef = useRef(categories);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentThreads, setRecentThreads] = useState([]); // newest first
    const [isModalOpen, setModalOpen] = useState(false);
    const { user, token } = useAuth();
    const [showProfile, setShowProfile] = useState(false);
    const [loadingThreads, setLoadingThreads] = useState(false);
    const [threadsError, setThreadsError] = useState('');
    // user count will be loaded from the API
    const [userCount, setUserCount] = useState(null);
    const navigate = useNavigate();
    const searchTimerRef = React.useRef(null);
    

    function openNewThread() {
        setModalOpen(true);
    }
    function closeNewThread() {
        setModalOpen(false);
    }

    // helper: load threads (optionally with search query q)
    const loadThreads = useCallback(async (q = null) => {
        setLoadingThreads(true);
        setThreadsError('');
        try {
            const data = await getThreads(q);
            // data expected to be an array of thread rows from backend
            const cats = categoriesRef.current || initialCategories;
            const mapped = (Array.isArray(data) ? data : []).map((t) => {
                const id = t.thread_id ?? t.threadId ?? t.id;
                const catId = t.category_id ?? t.categoryId ?? t.categoryId;
                const userId = t.user_id ?? t.userId ?? t.userId;
                const createdAt = t.created_at ?? t.createdAt ?? new Date().toISOString();
                return {
                    id,
                    title: t.title,
                    categoryId: Number(catId || 0),
                    categoryTitle: cats.find((c) => c.id === Number(catId))?.title || 'General',
                    content: t.content,
                    author: t.username ?? `User ${userId ?? ''}`,
                    createdAt: (typeof createdAt === 'string') ? createdAt : new Date(createdAt).toISOString(),
                };
            });

            setRecentThreads(mapped);
            // update Total Threads stat
            const total = mapped.length;
            setStats(prev => prev.map(s => s.id === 1 ? { ...s, value: total } : s));

            // update category thread counts from fetched threads
            const counts = {};
            mapped.forEach(m => { counts[m.categoryId] = (counts[m.categoryId] || 0) + 1; });
            setCategories(prevCats => prevCats.map(c => ({ ...c, threads: counts[c.id] || 0 })));
        } catch (e) {
            console.error('Failed to load threads', e);
            setThreadsError(e?.message || 'Failed to load threads from server');
        } finally {
            setLoadingThreads(false);
        }
    }, []);

    // keep categoriesRef up to date to avoid stale closures inside loadThreads
    useEffect(() => { categoriesRef.current = categories; }, [categories]);

    // called when modal submits a new thread
    async function handleCreateThread({ title, categoryId, content, author = "You" }) {
        // require login to create threads
        if (!user) {
            // redirect to login or show message
            if (window.confirm('You must be logged in to create a thread. Go to login?')) {
                navigate('/login');
            }
            return;
        }

        // derive numeric user id robustly (from auth user or localStorage fallback)
                let uid = undefined;
        try {
            const candidate = user && (user.id ?? user.user_id ?? user.userId ?? user.uid);
            uid = Number(candidate);
            if (!uid || uid <= 0) {
                const raw = sessionStorage.getItem('user');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    const cand2 = parsed && (parsed.id ?? parsed.user_id ?? parsed.userId ?? parsed.uid);
                    uid = Number(cand2);
                }
            }
        } catch (e) {
            uid = undefined;
        }

        if (!uid || uid <= 0) {
            // still no valid user id
            if (window.confirm('Could not determine your user id. Do you want to go to login to refresh your session?')) {
                navigate('/login');
            } else {
                alert('Please login before creating a thread.');
            }
            return;
        }

        // call backend API to create thread
        try {
            // pass token from AuthProvider to ensure Authorization header is sent
            const created = await createThread({ title, content, categoryId: Number(categoryId), userId: uid }, token);

            // map backend response to UI thread shape
            const id = created.thread_id ?? created.threadId ?? created.id ?? Date.now();
            const catId = created.category_id ?? created.categoryId ?? categoryId;
            const createdAt = created.created_at ?? created.createdAt ?? new Date().toISOString();
            const userId = created.user_id ?? created.userId ?? uid;

            const newThread = {
                id,
                title: created.title ?? title,
                categoryId: Number(catId),
                categoryTitle: categories.find((c) => c.id === Number(catId))?.title || "General",
                content: created.content ?? content,
                author: (created.username ?? created.author ?? (userId ? `User ${userId}` : author)),
                createdAt: (typeof createdAt === 'string') ? createdAt : new Date(createdAt).toISOString(),
            };

            // After successful create, re-load threads for current search (keeps counts consistent)
            try {
                await loadThreads(searchQuery);
            } catch (e) {
                // fallback: at least prepend so UI feels responsive
                setRecentThreads((prev) => [newThread, ...prev].slice(0, 20)); // keep last 20
                setCategories((prevCats) =>
                    prevCats.map((c) =>
                        c.id === Number(catId) ? { ...c, threads: (c.threads || 0) + 1 } : c
                    )
                );
                setStats(prev => prev.map(s => s.id === 1 ? { ...s, value: (Number(s.value) || 0) + 1 } : s));
            }

            setModalOpen(false);
        } catch (err) {
            // show a simple error - you can replace with a nicer UI state
            console.error('Failed to create thread', err);
            alert('Failed to create thread: ' + (err.message || err));
        }
    }

    

    // fetch user count from backend and update Members stat
    useEffect(() => {
        let mounted = true;
        async function fetchUserCount() {
            try {
                const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:8080').replace(/\/$/, '');
                const res = await fetch(`${apiBase}/api/users/count`);
                if (!res.ok) throw new Error('Failed to fetch user count');
                const json = await res.json();
                const count = Number(json && (json.count ?? json.total ?? json.userCount) || 0);
                if (!mounted) return;
                setUserCount(count);
                setStats(prev => prev.map(s => s.id === 2 ? { ...s, value: count } : s));
            } catch (e) {
                console.error('Failed to fetch user count', e);
            }
        }
        fetchUserCount();
        return () => { mounted = false; };
    }, []);

    // mount effect: call initial loaders after callbacks are defined
    useEffect(() => {
        loadThreads();
        return () => {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
                searchTimerRef.current = null;
            }
        };
    }, [loadThreads]);

    return (
        <div className="fd-page">
            <Link to="/" className="fd-home-tab" aria-label="Home">Home</Link>

            <header className="fd-header">
                <div className="fd-brand">
                    <h1 className="fd-title">Forum Community <span className="fd-beta">Beta</span></h1>
                </div>
                <div className="fd-actions" style={{ position: 'relative' }}>
                    <input
                        className="fd-search"
                        placeholder="Search threads..."
                        value={searchQuery}
                        onChange={(e) => {
                            const v = e.target.value;
                            setSearchQuery(v);
                            // debounce 300ms
                            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
                            searchTimerRef.current = setTimeout(() => {
                                loadThreads(v);
                                searchTimerRef.current = null;
                            }, 300);
                        }}
                    />
                    {!user ? (
                        <>
                            <Link to="/login" className="fd-btn">Sign In</Link>
                            <Link to="/signup" className="fd-btn fd-btn-primary">Sign Up</Link>
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                                aria-label="Profile"
                                title={user.username}
                                onClick={() => setShowProfile((s) => !s)}
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 999,
                                    border: 'none',
                                    background: '#0f1724',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                {(user.username || 'U').charAt(0).toUpperCase()
                                }
                            </button>
                            {showProfile && <ProfilePopup onClose={() => setShowProfile(false)} />}
                        </div>
                    )}
                </div>
            </header>

            <main className="fd-container">
                <section className="fd-stats-row">
                    {stats.map(s => (
                            <div key={s.id} className="fd-stat-card">
                            <div className="fd-stat-left">
                                <div className="fd-icon-box" style={{ background: s.color }}>
                                    <span className="fd-icon">{s.icon}</span>
                                </div>
                                <div>
                                        <div className="fd-stat-value">{s.value}</div>
                                    <div className="fd-stat-label">{s.label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="fd-section-header">
                    <h2 className="fd-section-title">Categories</h2>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {user && (String(user.role || '').toLowerCase() === 'admin') && (
                            <Link to="/threads-reports" className="fd-btn" style={{ background: '#111827', color: 'white' }}>Thread Reports</Link>
                        )}
                        <button className="fd-new-thread" onClick={openNewThread}>+ New Thread</button>
                    </div>
                </section>

                <section className="fd-grid">
                    {categories.map(c => (
                        <article key={c.id} className="fd-cat-card">
                            <div className="fd-cat-left">
                                <span className="fd-dot" style={{ background: c.dot }} />
                                <div>
                                    <div className="fd-cat-title">{c.title}</div>
                                    <div className="fd-cat-desc">{c.desc}</div>
                                </div>
                            </div>
                            <div className="fd-cat-right">
                                <span className="fd-threads-count">{c.threads} threads</span>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="fd-recent">
                    <h3>Recent Threads</h3>
                    {loadingThreads ? (
                        <div>Loading threads...</div>
                    ) : threadsError ? (
                        <div className="fd-recent-placeholder">
                            <div className="fd-empty">
                                <div className="fd-empty-icon">⚠️</div>
                                <div>Error loading threads: {threadsError}</div>
                                <div style={{ marginTop: 8 }}>
                                    <button className="fd-btn" onClick={() => {
                                        // retry using the same loadThreads helper and current search query
                                        setRecentThreads([]);
                                        setThreadsError('');
                                        loadThreads(searchQuery);
                                    }}>Retry</button>
                                </div>
                            </div>
                        </div>
                    ) : recentThreads.length === 0 ? (
                        <div className="fd-recent-placeholder">
                            <div className="fd-empty">
                                <div className="fd-empty-icon">📝</div>
                                <div>No recent threads yet</div>
                            </div>
                        </div>
                    ) : (
                        <ul className="fd-recent-list">
                            {recentThreads.map(t => (
                                <li key={t.id} className="fd-recent-item">
                                    <div className="fd-recent-left">
                                        <div className="fd-recent-title">{t.title}</div>
                                        <div className="fd-recent-meta">
                                            <span className="fd-recent-cat">{t.categoryTitle}</span>
                                            <span className="fd-recent-author">by {t.author}</span>
                                            <span className="fd-recent-time">{new Date(t.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="fd-recent-right">
                                        <Link to={`/thread/${t.id}`} className="fd-view-link">View</Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </main>

            {isModalOpen && (
                <NewThreadModal
                    categories={categories}
                    onClose={closeNewThread}
                    onCreate={handleCreateThread}
                />
            )}
        </div>
    );
}