// Simple API helper using fetch
// ใช้ URL ของ Spring Boot (เปลี่ยนเป็น URL จริงถ้าไม่ใช้ localhost:8080)
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080";

export async function sendLogin({ username, password }) {
    const url = `${API_BASE}/api/login`; // ตาม controller ที่ให้มา
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

    return await res.json();
}

// เพิ่มฟังก์ชันส่งข้อมูลสมัครสมาชิกไปยัง Spring Boot /api/register
export async function sendRegister({ username, password, email }) {
    const url = `${API_BASE}/api/register`;

    // local validation
    if (!username || !username.toString().trim() || !password || !password.toString().trim()) {
        throw new Error("username and password are required");
    }

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        // หากต้องการส่ง cookie/session ให้ใช้ credentials: 'include'
        // credentials: 'include',
        body: JSON.stringify({ username, password, email }),
    });

    if (!res.ok) {
        // Try to parse JSON error body, otherwise fallback to text
        let errMsg = "";
        try {
            const ct = res.headers.get("content-type") || "";
            if (ct.includes("application/json")) {
                const errJson = await res.json();
                if (errJson && typeof errJson === 'object') {
                    errMsg = errJson.message || JSON.stringify(errJson);
                } else {
                    errMsg = String(errJson);
                }
            } else {
                errMsg = await res.text().catch(() => "");
            }
        } catch (e) {
            // ignore parse errors
        }
        throw new Error(errMsg || `HTTP error ${res.status}`);
    }

    return await res.json();
}
