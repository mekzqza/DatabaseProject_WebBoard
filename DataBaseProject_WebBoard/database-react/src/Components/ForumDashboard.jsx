import React, { useState } from "react";
import { Link } from "react-router-dom";
import NewThreadModal from "./NewThreadModel";
import "./ CssStore/forumDashboard.css";

const initialStats = [
    { id: 1, icon: "💬", value: 3, label: "Total Threads", color: "var(--blue-50)" },
    { id: 2, icon: "👥", value: "5,678", label: "Active Members", color: "var(--green-50)" },
    { id: 3, icon: "📈", value: 89, label: "Online Now", color: "var(--amber-50)" },
];

const initialCategories = [
    { id: 1, title: "General Discussion", desc: "Talk about anything and everything", threads: 45, dot: "var(--blue-500)" },
    { id: 2, title: "Technology", desc: "Latest tech news and discussions", threads: 32, dot: "var(--green-500)" },
    { id: 3, title: "Help & Support", desc: "Get help from the community", threads: 18, dot: "var(--orange-500)" },
    { id: 4, title: "Announcements", desc: "Important updates and news", threads: 8, dot: "var(--purple-500)" },
];

export default function ForumDashboard() {
    const [stats] = useState(initialStats);
    const [categories, setCategories] = useState(initialCategories);
    const [recentThreads, setRecentThreads] = useState([]); // newest first
    const [isModalOpen, setModalOpen] = useState(false);

    function openNewThread() {
        setModalOpen(true);
    }
    function closeNewThread() {
        setModalOpen(false);
    }

    // called when modal submits a new thread
    function handleCreateThread({ title, categoryId, content, author = "You" }) {
        // create new thread object
        const newThread = {
            id: Date.now(), // simple unique id
            title,
            categoryId,
            categoryTitle: categories.find((c) => c.id === Number(categoryId))?.title || "General",
            content,
            author,
            createdAt: new Date().toISOString(),
        };

        // prepend to recentThreads
        setRecentThreads((prev) => [newThread, ...prev].slice(0, 20)); // keep last 20

        // increment category threads count
        setCategories((prevCats) =>
            prevCats.map((c) =>
                c.id === Number(categoryId) ? { ...c, threads: (c.threads || 0) + 1 } : c
            )
        );

        // close modal
        setModalOpen(false);
    }

    return (
        <div className="fd-page">
            <Link to="/" className="fd-home-tab" aria-label="Home">Home</Link>

            <header className="fd-header">
                <div className="fd-brand">
                    <h1 className="fd-title">Forum Community <span className="fd-beta">Beta</span></h1>
                </div>
                <div className="fd-actions">
                    <input className="fd-search" placeholder="Search threads..." />
                    <Link to="/login" className="fd-btn">Sign In</Link>
                    <Link to="/signup" className="fd-btn fd-btn-primary">Sign Up</Link>
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
                    <button className="fd-new-thread" onClick={openNewThread}>+ New Thread</button>
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
                    {recentThreads.length === 0 ? (
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