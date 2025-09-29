import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { updateUser, getUser } from './APIs/api';
import './CssStore/edit-profile.css';

export default function EditProfile() {
    const { user, login, token } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [socialLinks, setSocialLinks] = useState(user?.social_links || user?.social || '');
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
            // Prepare payload for backend. Ensure we send an id (user_id or id)
            const id = user?.user_id ?? user?.id ?? user?.userId;
            if (!id) {
                setError('ไม่พบรหัสผู้ใช้ (id) เพื่ออัปเดต');
                setSaving(false);
                return;
            }

            const payload = {
                // backend helper accepts user.id or user.user_id; updateUser maps to user_id
                user_id: id,
                username: username,
                email: email,
                bio: bio,
                social_links: socialLinks,
                // use avatarPreview (DataURL) if present, otherwise send null to clear
                avatar_url: avatarPreview || null,
            };

            // send token explicitly so backend auth middleware accepts it
            await updateUser(payload, token);

            // fetch updated user from backend to get canonical fields
            const fresh = await getUser(id, token);
            const merged = { ...(user || {}), ...(fresh || {}), avatarUrl: (fresh && (fresh.avatar_url || fresh.avatarUrl)) || avatarPreview || '' };
            login(merged);
            navigate('/profile');
        } catch (err) {
            setError(err && err.message ? err.message : String(err) || 'เกิดข้อผิดพลาด');
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
                            <label style={{ marginTop: 8 }}>
                                Social links (comma-separated or JSON)
                                <input value={socialLinks} onChange={(e) => setSocialLinks(e.target.value)} placeholder="https://twitter.com/you, https://github.com/you" />
                            </label>
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
