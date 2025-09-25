import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import './CssStore/edit-profile.css';

export default function EditProfile() {
    const { user, login } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const fileRef = useRef(null);

    function onCancel() {
        navigate('/profile');
    }

    function handleAvatarChange(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setAvatarPreview(reader.result);
        };
        reader.readAsDataURL(file);
    }

    function onRemoveAvatar() {
        setAvatarPreview('');
    }

    async function onSave(e) {
        e.preventDefault();
        setError('');
        if (!username || !email) {
            setError('กรุณากรอกชื่อและอีเมล');
            return;
        }
        // basic email check
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError('อีเมลไม่ถูกต้อง');
            return;
        }
        setSaving(true);
        try {
            // Update client-side user (would call API in real app)
            const updated = {
                ...user,
                username,
                email,
                bio,
                avatarUrl: avatarPreview || undefined,
            };
            login(updated);
            navigate('/profile');
        } catch (err) {
            setError('เกิดข้อผิดพลาด');
        } finally {
            setSaving(false);
        }
    }

    const joinDateText = user?.joinDate ? new Date(user.joinDate).toLocaleDateString() : '—';

    return (
        <div className="ep-page">
            <div className="ep-card">
                <h2>แก้ไขโปรไฟล์</h2>
                <form onSubmit={onSave} className="ep-form">
                    <div className="ep-top-row">
                        <div className="ep-avatar-col">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="avatar" className="ep-avatar-img" />
                            ) : (
                                <div className="ep-avatar-fallback">{(username || 'U').charAt(0).toUpperCase()}</div>
                            )}
                            <div className="ep-avatar-actions">
                                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                                <button type="button" className="ep-btn" onClick={() => fileRef.current?.click()}>อัปโหลดโปรไฟล์</button>
                                {avatarPreview && <button type="button" className="ep-btn ep-cancel" onClick={onRemoveAvatar}>ลบรูป</button>}
                            </div>
                        </div>
                        <div className="ep-fields-col">
                            <label>
                                ชื่อผู้ใช้
                                <input value={username} onChange={(e) => setUsername(e.target.value)} />
                            </label>
                            <label>
                                อีเมล
                                <input value={email} onChange={(e) => setEmail(e.target.value)} />
                            </label>
                            <div className="ep-join">วันที่เข้าร่วม: <strong>{joinDateText}</strong></div>
                        </div>
                    </div>

                    <label>
                        BIO
                        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
                    </label>

                    {error && <div className="ep-error">{error}</div>}
                    <div className="ep-actions">
                        <button type="button" className="ep-btn ep-cancel" onClick={onCancel}>ยกเลิก</button>
                        <button type="submit" className="ep-btn ep-save" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
