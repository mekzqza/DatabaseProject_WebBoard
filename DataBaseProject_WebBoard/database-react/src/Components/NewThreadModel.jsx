import React, { useState } from "react";
import { createThread } from './APIs/apiThread';

export default function NewThreadModal({ categories = [], onClose, onCreate }) {
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
    const [content, setContent] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function submit(e) {
        e.preventDefault();
        setError("");
        if (!title.trim()) return setError("Please enter a thread title.");
        if (!categoryId) return setError("Please select a category.");
        if (!content.trim()) return setError("Please enter thread content.");

        setLoading(true);
        try {
            const res = await createThread({
                title: title.trim(),
                categoryId: Number(categoryId),
                content: content.trim(),
                author: "You"
            });

            const createdThread = res?.thread;
            if (onCreate && createdThread) onCreate(createdThread);
        } catch (err) {
            console.error(err);
            setError(err.body?.message || err.message || "Failed to create thread");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fd-modal-backdrop" onMouseDown={onClose}>
            <div className="fd-modal" role="dialog" aria-modal="true" aria-labelledby="fd-modal-title" onMouseDown={(e) => e.stopPropagation()}>
                <h3 id="fd-modal-title" className="fd-modal-title">Create New Thread</h3>
                <form className="fd-modal-form" onSubmit={submit}>
                    <label className="fd-label">
                        Title
                        <input className="fd-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Thread title" />
                    </label>

                    <label className="fd-label">
                        Category
                        <select className="fd-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </label>

                    <label className="fd-label">
                        Content
                        <textarea className="fd-textarea" rows="6" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Start your thread here..." />
                    </label>

                    {error && <div className="fd-modal-error" role="alert">{error}</div>}

                    <div className="fd-modal-actions">
                        <button type="button" className="fd-btn" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className="fd-btn fd-btn-primary" disabled={loading}>{loading ? "Creating..." : "Create Thread"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}