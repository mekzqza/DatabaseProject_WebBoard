import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { sendResetPassword } from './APIs/api';
import './CssStore/forgotpassword.css';

function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [out, setOut] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const [token, setToken] = useState(null);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const qp = new URLSearchParams(location.search);
        const t = qp.get('token');
        const id = qp.get('id') || qp.get('user_id');
        setToken(t);
        setUserId(id);
        if (!t || !id) {
            setOut('Invalid reset link.');
        }
    }, [location.search]);

    async function onSubmit(e) {
        e.preventDefault();
        setOut("");
        if (!token || !userId) {
            setOut('Invalid reset link.');
            return;
        }
        if (!password || password.length < 6) {
            setOut('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirm) {
            setOut('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const body = { user_id: userId, token, newPassword: password };
            const data = await sendResetPassword(body);
            // expect { status: true } on success
            if (data && data.status) {
                setOut('Password updated. Redirecting to login...');
                setTimeout(() => navigate('/login'), 1800);
            } else {
                setOut((data && data.message) ? data.message : 'Failed to reset password.');
            }
        } catch (err) {
            setOut('Error: ' + (err.message || err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="pp-page">
            <div className="pp-animated-bg" aria-hidden="true">
                <div className="bg-blobs">
                    <div className="blob b1" />
                    <div className="blob b2" />
                    <div className="blob b3" />
                    <div className="blob b4" />
                </div>
                <div className="bg-gradient" />
            </div>

            <Link to="/" className="pp-home-tab" aria-label="Home">Home</Link>

            <div className="pp-forgot-container">
                <div className="pp-forgot-card">
                    <h3 className="pp-forgot-title">Reset Password</h3>
                    <p className="pp-forgot-subtitle">Enter a new password for your account.</p>

                    <form onSubmit={onSubmit} className="pp-forgot-form">
                        <input
                            className="pp-forgot-input"
                            placeholder="New password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                        <input
                            className="pp-forgot-input"
                            placeholder="Confirm password"
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                        />

                        <button className="pp-forgot-button" type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save new password"}
                        </button>
                    </form>

                    {out && <p className={out.startsWith('Error') ? "pp-error-message" : "pp-message"}>{out}</p>}

                    <div className="pp-forgot-actions">
                        <p>
                            Remembered? <span onClick={() => navigate('/login')} className="pp-signup-link-text">Sign in</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
