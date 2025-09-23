import { useState } from "react";
import { useNavigate } from "react-router-dom";  // นำเข้า useNavigate
import { sendLogin } from './APIs/api';

import './ CssStore/login.css'

function LoginPage() {
    const [username, setU] = useState("");
    const [password, setP] = useState("");
    const [out, setOut] = useState("");
    const [loading, setLoading] = useState(false);  // สถานะการโหลด

    const navigate = useNavigate();  // ใช้ useNavigate เพื่อเปลี่ยนหน้า

    // ฟังก์ชันสำหรับการล็อกอิน
    async function onLogin(e) {
        e.preventDefault();
        if (username === "" || password === "") {
            setOut("Please fill in both username and password.");
            return;
        }
        setLoading(true);  // ตั้งค่า loading เป็น true เมื่อเริ่มส่งคำขอ
        try {
            const data = await sendLogin({ username, password });
            setOut(JSON.stringify(data, null, 2));

            // ถ้าล็อกอินสำเร็จ จะไปหน้า /dashboard
            if (data.success) {
                navigate("/dashboard");  // เปลี่ยนหน้าไปที่ /dashboard
            } else {
                setOut("Login failed. Please check your credentials.");
            }
        } catch (err) {
            setOut("Error: " + err.message);
        } finally {
            setLoading(false);  // ปิดสถานะการโหลดหลังจากเสร็จสิ้น
        }
    }

    return (
        <div style={{ padding: 16 }}>
            <h3>Login</h3>
            <form onSubmit={onLogin}>
                <input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setU(e.target.value)}
                />
                <input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setP(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
            <pre style={{ marginTop: 24 }}>{out}</pre>
            <button onClick={() => navigate("/signup")}>Sign Up</button>  {/* รีไดเร็กต์ไปที่หน้า Signup */}
        </div>
    );
}

export default LoginPage;
