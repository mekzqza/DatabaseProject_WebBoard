import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import './CssStore/profile.css';
import { getThreads } from './APIs/ThreadsApi';

export default function Profile() {
    const { user, logout, login } = useAuth();
    const navigate = useNavigate();
    const fileRef = useRef(null);
    const [threads, setThreads] = useState([]);
    const [loadingThreads, setLoadingThreads] = useState(false);

    function handleLogout() {
        logout();
        navigate('/');
    }

    function onFileChange(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            // update user with avatar data URL
            const updated = { ...user, avatarUrl: reader.result };
            try {
                login(updated);
            } catch (err) {
                // ignore
            }
        };
        reader.readAsDataURL(file);
    }

    const joinDate = user?.joinDate ? new Date(user.joinDate).toLocaleDateString() : '—';

    useEffect(() => {
        let mounted = true;
        async function load() {
            if (!user || !user.user_id) return;
            setLoadingThreads(true);
            try {
                const data = await getThreads(null, user.user_id);
                if (mounted) setThreads(Array.isArray(data) ? data : []);
            } catch (e) {
                // ignore
            } finally {
                if (mounted) setLoadingThreads(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [user]);

    return (
        <div className="profile-page">
            <div className="profile-card">
                <div className="profile-avatar" aria-hidden>
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="avatar" className="profile-avatar-img" />
                    ) : (
                        <div className="profile-avatar-fallback">{(user?.username || 'U').charAt(0).toUpperCase()}</div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
                </div>
                <div className="profile-info">
                    <h2 className="profile-name">{user?.username || '—'}</h2>
                    <p className="profile-email">{user?.email || '—'}</p>
                    <div className="profile-meta">วันที่เข้าร่วม: <strong>{joinDate}</strong></div>
                    {user?.bio && <p className="profile-bio">{user.bio}</p>}
                    <div className="profile-actions">
                        <button className="btn btn-ghost" onClick={() => navigate('/profile/edit')}>แก้ไขโปรไฟล์</button>
                        <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>อัปโหลดโปรไฟล์</button>
                        <button className="btn btn-primary" onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            </div>
            <div className="profile-threads">
                <h3>กระทู้ของฉัน</h3>
                {loadingThreads ? (
                    <div>Loading...</div>
                ) : (
                    <ul className="threads-list">
                        {threads.length === 0 && <li className="muted">ยังไม่มีกระทู้</li>}
                        {threads.map(t => (
                            <li key={t.thread_id} className="thread-item">
                                <a href={`/thread/${t.thread_id}`}>{t.title}</a>
                                <div className="thread-meta">{new Date(t.created_at).toLocaleString()}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
