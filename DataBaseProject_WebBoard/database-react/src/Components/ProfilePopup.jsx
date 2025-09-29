import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import './CssStore/profile-popup.css';

export default function ProfilePopup({ onClose }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape') onClose?.();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    function handleLogout() {
        logout();
        onClose?.();
        // send to home
        navigate('/');
    }

    const avatarEl = user?.avatarUrl ? (
        <img src={user.avatarUrl} alt="avatar" className="ppop-avatar" />
    ) : (
        <div className="ppop-avatar">{(user?.username || 'U').charAt(0).toUpperCase()}</div>
    );

    return (
        <div className="ppop-backdrop" onMouseDown={() => onClose?.()}>
            <div className="ppop-panel" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Profile">
                <button className="ppop-close" onClick={() => onClose?.()} aria-label="Close">×</button>

                <div className="ppop-top">
                    <div className="ppop-email">{user?.email || ''}</div>
                </div>

                <div className="ppop-main">
                    {avatarEl}
                    <div className="ppop-info">
                        <div className="ppop-name">{user?.username || 'User'}</div>
                        <div className="ppop-subbtns">
                            <button
                                className="ppop-btn"
                                onClick={() => { onClose?.(); navigate('/profile/edit'); }}
                            >แก้ไขโปรไฟล์</button>
                            {user && String(user.role || '').toLowerCase() === 'admin' && (
                                <button
                                    className="ppop-btn ppop-admin"
                                    onClick={() => { onClose?.(); navigate('/admin'); }}
                                >Admin Panel</button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="ppop-accounts">
                    <div className="ppop-accounts-title">บัญชีอื่นๆ</div>
                    {/* placeholder for accounts list - expand as needed */}
                    <div className="ppop-account">
                        <div className="ppop-account-icon">{(user?.username || 'U').charAt(0).toUpperCase()}</div>
                        <div className="ppop-account-info">
                            <div className="ppop-account-name">{user?.username || 'User'}</div>
                            <div className="ppop-account-email">{user?.email || ''}</div>
                        </div>
                    </div>
                    <button className="ppop-add">สลับบัญชี</button>
                </div>

                <div className="ppop-actions">
                    <button className="ppop-logout" onClick={handleLogout}>ออกจากระบบ</button>
                </div>
            </div>
        </div>
    );
}
