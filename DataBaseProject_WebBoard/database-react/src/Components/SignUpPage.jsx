import { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // นำเข้า useNavigate สำหรับการเปลี่ยนหน้า

function SignUpPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);  // สถานะการโหลด
    const [error, setError] = useState('');  // ข้อความแสดงข้อผิดพลาด
    const navigate = useNavigate();  // ใช้ useNavigate เพื่อเปลี่ยนหน้า

    // ฟังก์ชันสำหรับการสมัครสมาชิก
    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');  // รีเซ็ตข้อความแสดงข้อผิดพลาด
        if (username === '' || password === '' || email === '') {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);  // ตั้งค่า loading เป็น true เมื่อเริ่มส่งคำขอ
        try {
            // ตัวอย่างการส่งข้อมูลไปที่ backend (คุณสามารถปรับให้เหมาะสมกับ API ของคุณ)
            // const response = await sendSignUp({ username, password, email });

            // สมมุติว่า API สมัครสมาชิกสำเร็จ
            setTimeout(() => {
                // เมื่อสมัครเสร็จเรียบร้อย
                setLoading(false);  // ปิดสถานะการโหลด
                navigate("/login");  // ไปที่หน้า Login
            }, 2000);  // หน่วงเวลา 2 วินาทีเพื่อทดสอบ
        } catch (err) {
            setError('Error: ' + err.message);  // แสดงข้อผิดพลาดจาก backend
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 16 }}>
            <h2>Sign Up</h2>
            <form onSubmit={handleSignUp}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                {error && <p style={{ color: 'red' }}>{error}</p>}  {/* แสดงข้อผิดพลาด */}
                <button type="submit" disabled={loading}>
                    {loading ? 'Signing Up...' : 'Sign Up'}
                </button>
            </form>
        </div>
    );
}

export default SignUpPage;
