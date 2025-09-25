import React, { useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import './CssStore/profile.css';

export default function Profile() {
    const { user, logout, login } = useAuth();
    const navigate = useNavigate();
    const fileRef = useRef(null);

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
        </div>
    );
}
