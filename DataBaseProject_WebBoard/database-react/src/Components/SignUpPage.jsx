import { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // Import useNavigate for page redirection
import './ CssStore/singup.css'
function SignUpPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');  // State for confirm password
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);  // Loading state
    const [error, setError] = useState('');  // Error message
    const navigate = useNavigate();  // Use navigate to redirect

    // Sign-up function
    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');  // Reset error message

        if (username === '' || password === '' || email === '' || confirmPassword === '') {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);  // Set loading to true when starting the request
        try {
            // Simulate successful sign-up with a timeout
            setTimeout(() => {
                setLoading(false);  // Stop loading
                navigate("/login");  // Redirect to login page after success
            }, 2000);  // Delay for 2 seconds to simulate API request
        } catch (err) {
            setError('Error: ' + err.message);  // Display error from backend
            setLoading(false);
        }
    };

    // Redirect to login page
    const redirectToLogin = () => {
        navigate("/login");
    };

    return (
        <div className="signup-container">
            <div className="signup-card">
                <h3 className="signup-title">Sign Up</h3>
                <p className="signup-subtitle">Create a new account to get started</p>
                <form onSubmit={handleSignUp} className="signup-form">
                    <input
                        className="signup-input"
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        className="signup-input"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        className="signup-input"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <input
                        className="signup-input"
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {error && <p className="error-message">{error}</p>}
                    <button className="signup-button" type="submit" disabled={loading}>
                        {loading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>
                <div className="login-link">
                    <p>Already have an account? <span onClick={redirectToLogin} className="login-link-text">Login</span></p>
                </div>
            </div>
        </div>
    );
}

export default SignUpPage;
