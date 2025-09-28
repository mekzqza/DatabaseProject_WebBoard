import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ CssStore/singup.css';
import './CssStore/animated-background.css';
import { sendRegister } from './APIs/api';
import { useAuth } from './AuthProvider';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080";

function SignUpPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    // realtime availability checks removed — validation happens on submit

    

    
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!username || !password || !email || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // basic email check
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError('Please enter a valid email');
            return;
        }

        setLoading(true);
        try {
            // call backend register API (validation happens on submit)
            const usernameNormalized = (username || '').toString().trim();
            const emailNormalized = (email || '').toString().trim().toLowerCase();
            const res = await sendRegister({ username: usernameNormalized, password, email: emailNormalized });
            if (res && res.status) {
                // set client auth so header shows profile
                try { login({ username: res.username || username, email: email }); } catch (e) {}
                setSuccess(res.message || 'Account created successfully. Redirecting...');
                // brief delay so user sees success message
                setTimeout(() => {
                    setLoading(false);
                    navigate('/');
                }, 900);
            } else {
                // server responded but indicated failure
                setError(res?.message || 'Failed to create account');
                setLoading(false);
            }
        } catch (err) {
            setError('Error: ' + (err?.message || 'Something went wrong'));
            setLoading(false);
        }
    };

    const redirectToLogin = () => navigate('/login');

    return (
        <div className="pp-page">
            {/* Animated background layer */}
            <div className="pp-animated-bg" aria-hidden="true">
                <div className="bg-blobs">
                    <div className="blob b1" />
                    <div className="blob b2" />
                    <div className="blob b3" />
                    <div className="blob b4" />
                </div>
                <div className="bg-gradient" />
            </div>

            {/* Bottom-left Home tab (if still needed on signup) */}
            <Link to="/" className="pp-home-tab" aria-label="Home">Home</Link>

            <div className="pp-signup-container">
                <div className="pp-signup-card">
                    <div className="pp-logo-glow"></div>
                    <h3 className="pp-signup-title">
                        <span className="pp-logo"></span> Create Account
                    </h3>
                    <p className="pp-signup-subtitle">Join and start editing like a pro</p>

                    <form onSubmit={handleSignUp} className="pp-signup-form" noValidate>
                        <input
                            className="pp-signup-input"
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoFocus
                        />
                        <div style={{ height: 20 }} />
                        <input
                            className="pp-signup-input"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <div style={{ height: 20 }} />
                        <input
                            className="pp-signup-input"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <input
                            className="pp-signup-input"
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />

                        {error && <p className="pp-error-message">{error}</p>}
                        {success && <p className="pp-success-message">{success}</p>}

                        <button className="pp-signup-button" type="submit" disabled={loading}>
                            {loading ? 'Signing Up...' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="pp-login-link">
                        <p>Already have an account? <span onClick={redirectToLogin} className="pp-login-link-text">Login</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignUpPage;