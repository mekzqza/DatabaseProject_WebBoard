import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getThreadById } from './APIs/ThreadsApi';
import './CssStore/forumDashboard.css';

export default function ThreadView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [thread, setThread] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError('');
        getThreadById(id).then(data => {
            if (!mounted) return;
            setThread(data);
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
                        <h2 className="fd-recent-title">{thread.title}</h2>
                        <div className="fd-recent-meta">
                            <span className="fd-recent-cat">{thread.categoryTitle || thread.category || 'General'}</span>
                            <span className="fd-recent-author">by {thread.author || thread.username || 'Unknown'}</span>
                            <span className="fd-recent-time">{thread.createdAt ? new Date(thread.createdAt).toLocaleString() : ''}</span>
                        </div>
                        <div style={{ marginTop: 12 }} dangerouslySetInnerHTML={{ __html: thread.content || thread.body || '' }} />
                    </article>
                )}
            </main>
        </div>
    );
}
