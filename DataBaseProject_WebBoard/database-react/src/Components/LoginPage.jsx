import { useState } from "react";
import { useNavigate } from "react-router-dom";  // Import useNavigate
import { sendLogin } from './APIs/api';
import './ CssStore/login.css';

function LoginPage() {
    const [username, setU] = useState("");
    const [password, setP] = useState("");
    const [out, setOut] = useState("");
    const [loading, setLoading] = useState(false);  // Loading state

    const navigate = useNavigate();  // Use navigate to change pages

    // Login function
    async function onLogin(e) {
        e.preventDefault();
        if (username === "" || password === "") {
            setOut("Please fill in both username and password.");
            return;
        }
        setLoading(true);  // Set loading to true when the request starts
        try {
            const data = await sendLogin({ username, password });
            setOut(JSON.stringify(data, null, 2));

            // If login is successful, navigate to /dashboard
            if (data.success) {
                navigate("/dashboard");  // Redirect to dashboard
            } else {
                setOut("Login failed. Please check your credentials Niggaaaaa.");
            }
        } catch (err) {
            setOut("Error: " + err.message);
        } finally {
            setLoading(false);  // Turn off loading state after completion
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h3 className="login-title">Login</h3>
                <p className="login-subtitle">Enter your credentials to access your account</p>
                <form onSubmit={onLogin} className="login-form">
                    <input
                        className="login-input"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setU(e.target.value)}
                    />
                    <input
                        className="login-input"
                        placeholder="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setP(e.target.value)}
                    />
                    <button className="login-button" type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
                {out && <p className="error-message">{out}</p>}
                <div className="signup-link">
                    <p>Don't have an account? <span onClick={() => navigate("/signup")} className="signup-link-text">Sign Up</span></p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
