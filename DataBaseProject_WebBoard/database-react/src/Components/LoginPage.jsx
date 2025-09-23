import { useState } from "react";
import { useNavigate } from "react-router-dom";  // นำเข้า useNavigate
import { sendLogin } from './Components/APIs/api';

function LoginPage() {
    const [username, setU] = useState("");
    const [password, setP] = useState("");
    const [out, setOut] = useState("");

    const navigate = useNavigate();  // ใช้ useNavigate เพื่อเปลี่ยนหน้า

    // ฟังก์ชันสำหรับการล็อกอิน
    async function onLogin(e) {
        e.preventDefault();
        try {
            const data = await sendLogin({ username, password });
            setOut(JSON.stringify(data, null, 2));

            // ถ้าล็อกอินสำเร็จ จะไปหน้า /dashboard
            if (data.success) {
                navigate("/dashboard");  // เปลี่ยนหน้าไปที่ /dashboard
            } else {
                setOut("Login failed");
            }
        } catch (err) {
            setOut("Error: " + err.message);
        }
    }

    return (
        <div style={{ padding: 16 }}>
            <h3>Login</h3>
            <form onSubmit={onLogin}>
                <input placeholder="username" value={username} onChange={e => setU(e.target.value)} />
                <input placeholder="password" type="password" value={password} onChange={e => setP(e.target.value)} />
                <button type="submit">Login</button>
            </form>
            <pre style={{marginTop:24}}>{out}</pre>
            <button onClick={() => navigate("/signup")}>Sign Up</button>  {/* รีไดเร็กต์ไปที่หน้า Signup */}
        </div>
    );
}

export default LoginPage;
