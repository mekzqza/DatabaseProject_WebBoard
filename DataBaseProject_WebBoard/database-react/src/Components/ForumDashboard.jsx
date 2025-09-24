import React from "react";
import './ CssStore/forumDashboard.css'

const stats = [
    { id: 1, icon: "💬", value: 3, label: "Total Threads", color: "var(--blue-50)" },
    { id: 2, icon: "👥", value: "5,678", label: "Active Members", color: "var(--green-50)" },
    { id: 3, icon: "📈", value: 89, label: "Online Now", color: "var(--amber-50)" },
];

const categories = [
    { id: 1, title: "General Discussion", desc: "Talk about anything and everything", threads: 45, dot: "var(--blue-500)" },
    { id: 2, title: "Technology", desc: "Latest tech news and discussions", threads: 32, dot: "var(--green-500)" },
    { id: 3, title: "Help & Support", desc: "Get help from the community", threads: 18, dot: "var(--orange-500)" },
    { id: 4, title: "Announcements", desc: "Important updates and news", threads: 8, dot: "var(--purple-500)" },
];

export default function ForumDashboard() {
    return (
        <div className="fd-page">
            <header className="fd-header">
                <div className="fd-brand">
                    <h1 className="fd-title">Forum Community <span className="fd-beta">Beta</span></h1>
                </div>
                <div className="fd-actions">
                    <input className="fd-search" placeholder="Search threads..." />
                    <button className="fd-btn">Sign In</button>
                    <button className="fd-btn fd-btn-primary">Sign Up</button>
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
                    <button className="fd-new-thread">+ New Thread</button>
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
                    <div className="fd-recent-placeholder">
                        {/* ใส่รายการ recent threads ที่นี่เมื่อพร้อม */}
                        <div className="fd-empty">
                            <div className="fd-empty-icon">📝</div>
                            <div>No recent threads yet</div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}