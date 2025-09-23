import { useState } from 'react';

function SignUpPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');

    const handleSignUp = (e) => {
        e.preventDefault();
        // ล็อกข้อมูลที่กรอกในฟอร์ม หรือส่งข้อมูลไปที่ Backend เพื่อทำการสมัครสมาชิก
        console.log({ username, password, email });
        // คุณสามารถเพิ่ม logic สำหรับการสมัครสมาชิกที่นี่
    };

    return (
        <div>
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
                <button type="submit">Sign Up</button>
            </form>
        </div>
    );
}

export default SignUpPage;
