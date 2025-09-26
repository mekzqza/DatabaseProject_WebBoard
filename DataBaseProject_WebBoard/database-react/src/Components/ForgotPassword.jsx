import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { sendForgotPassword } from './APIs/api';
import './CssStore/forgotpassword.css';

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [out, setOut] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function onSubmit(e) {
        e.preventDefault();
        setOut("");
        if (!email || !email.toString().trim()) {
            setOut("Please enter your email.");
            return;
        }
        setLoading(true);
        try {
            const data = await sendForgotPassword({ email });
            // show server message if any, otherwise generic
            if (data && typeof data === 'object') {
                setOut(data.message || "If that email exists, a reset link has been sent.");
            } else {
                setOut(String(data) || "If that email exists, a reset link has been sent.");
            }
        } catch (err) {
            setOut("Error: " + (err.message || err));
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
                    <h3 className="pp-forgot-title">Forgot Password</h3>
                    <p className="pp-forgot-subtitle">Enter your email and we'll send a reset link.</p>

                    <form onSubmit={onSubmit} className="pp-forgot-form">
                        <input
                            className="pp-forgot-input"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoFocus
                        />
                        <button className="pp-forgot-button" type="submit" disabled={loading}>
                            {loading ? "Sending..." : "Send reset link"}
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

export default ForgotPassword;

