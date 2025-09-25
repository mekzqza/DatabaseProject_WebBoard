import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { sendLogin } from './APIs/api';
import './CssStore/login.css'
import './CssStore/animated-background.css';
import { useAuth } from './AuthProvider';

function LoginPage() {
    const [username, setU] = useState("");
    const [password, setP] = useState("");
    const [out, setOut] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    // Login function
    async function onLogin(e) {
        e.preventDefault();
        if (username === "" || password === "") {
            setOut("Please fill in both username and password.");
            return;
        }
        setLoading(true);
        try {
            const data = await sendLogin({ username, password });

            // show server message if any
            if (data && typeof data === 'object') {
                setOut(data.message || '');
            }

            // If login is successful, navigate to /
            // API returns { status: true/false, message: ... }
            if (data && data.status) {
                // set simple client-side auth state so header shows profile
                try {
                    login({ username: data.username || username, email: data.email || '' });
                } catch (e) {
                    // ignore
                }
                navigate("/");
            } else {
                // keep out message set above or show default
                if (!data || !data.message) setOut("Login failed. Please check your credentials.");
            }
        } catch (err) {
            setOut("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="pp-page">
            {/* Animated background layer (handled by CSS) */}
            <div className="pp-animated-bg" aria-hidden="true">
                <div className="bg-blobs">
                    <div className="blob b1" />
                    <div className="blob b2" />
                    <div className="blob b3" />
                    <div className="blob b4" />
                </div>
                <div className="bg-gradient" />
            </div>

            {/* Bottom-left Home tab (kept if you use it elsewhere) */}
            <Link to="/" className="pp-home-tab" aria-label="Home">Home</Link>

            <div className="pp-login-container">
                <div className="pp-login-card">
                    <div className="pp-logo-glow"></div>
                    <h3 className="pp-login-title">
                        <span className="pp-logo"></span> Login
                    </h3>
                    <p className="pp-login-subtitle">Sign in to start editing like a pro</p>
                    <form onSubmit={onLogin} className="pp-login-form">
                        <input
                            className="pp-login-input"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setU(e.target.value)}
                            autoFocus
                        />
                        <input
                            className="pp-login-input"
                            placeholder="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setP(e.target.value)}
                        />
                        <button className="pp-login-button" type="submit" disabled={loading}>
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                    {out && <p className="pp-error-message">{out}</p>}
                    <div className="pp-signup-link">
                        <p>Don't have an account? <span onClick={() => navigate("/signup")} className="pp-signup-link-text">Sign Up</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;