// Simple API helper using fetch
// ใช้ URL ของ Spring Boot (เปลี่ยนเป็น URL จริงถ้าไม่ใช้ localhost:8080)
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080";

export async function sendLogin({ username, password }) {
    const url = `${API_BASE}/api/submit`; // ตาม controller ที่ให้มา
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        // ถ้าคุณใช้ httpOnly cookie สำหรับ session/refresh token ให้ใส่ credentials: 'include'
        // credentials: 'include',
        body: JSON.stringify({ username, password }),
    });

    // ถ้าต้องการแยก case ของ HTTP status:
    if (!res.ok) {
        // ตัวอย่าง: 400/500
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP error ${res.status}`);
    }






    const data = await res.json();
    return data; // คาดหวัง shape: { status: true/false, message: "...", username: "..." }
}