import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ CssStore/singup.css';


function SignUpPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

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
            // Replace this setTimeout with your real API call (await createAccount(...))
            await new Promise((res) => setTimeout(res, 1400));
            setSuccess('Account created successfully. Redirecting to login...');
            setTimeout(() => {
                setLoading(false);
                navigate('/login');
            }, 900);
        } catch (err) {
            setError('Error: ' + (err?.message || 'Something went wrong'));
            setLoading(false);
        }
    };

    const redirectToLogin = () => navigate('/login');

    return (
        <div className="pp-signup-container">
            {/* Top-left Home tab (fixed position) */}
            <Link to="/forumDashboard" className="pp-home-tab" aria-label="Home">Home</Link>

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
                    <input
                        className="pp-signup-input"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
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
    );
}

export default SignUpPage;