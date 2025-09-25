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

// Helper to parse response and normalize error messages
async function handleResponse(res) {
    if (res.ok) {
        // try to parse JSON, otherwise return text
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
            return await res.json();
        }
        return await res.text();
    }

    // parse error body if possible
    let errMsg = '';
    try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
            const errJson = await res.json();
            if (errJson && typeof errJson === 'object') {
                errMsg = errJson.message || JSON.stringify(errJson);
            } else {
                errMsg = String(errJson);
            }
        } else {
            errMsg = await res.text().catch(() => '');
        }
    } catch (e) {
        // ignore
    }

    throw new Error(errMsg || `HTTP error ${res.status}`);
}

// API: รับรายชื่อผู้ใช้ทั้งหมด
export async function getUsers() {
    const url = `${API_BASE}/api/users`;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        }
    });
    return await handleResponse(res);
}

// API: รับผู้ใช้โดย id
// คืนค่า object ที่มีฟิลด์ (ตาม DB): user_id, username, email, password_hash, avatar_url, bio, social_links, role
export async function getUser(userId) {
    if (!userId && userId !== 0) throw new Error('userId is required');
    const url = `${API_BASE}/api/users/${encodeURIComponent(userId)}`;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        }
    });
    return await handleResponse(res);
}

// API: อัพเดตข้อมูลผู้ใช้ (PUT)
// รับ object user ที่มีอย่างน้อย id/user_id และอื่นๆ เป็น optional
export async function updateUser(user) {
    if (!user || (!user.id && !user.user_id)) throw new Error('user (with id or user_id) is required');
    const id = user.id || user.user_id;

    // map fields to the names your backend expects
    const payload = {
        user_id: id,
        username: user.username,
        email: user.email,
        // allow passing either password or password_hash
        password_hash: user.password_hash || user.password,
        avatar_url: user.avatar || user.avatar_url,
        bio: user.bio,
        social_links: user.social || user.social_links,
        role: user.role,
    };

    const url = `${API_BASE}/api/users/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    return await handleResponse(res);
}

// Optional: สร้างผู้ใช้ใหม่ (POST /api/users)
export async function createUser(user) {
    const url = `${API_BASE}/api/users`;
    const payload = {
        username: user.username,
        email: user.email,
        password_hash: user.password_hash || user.password,
        avatar_url: user.avatar || user.avatar_url,
        bio: user.bio,
        social_links: user.social || user.social_links,
        role: user.role,
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    return await handleResponse(res);
}
