const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080";

async function handleResponse(res) {
    const text = await res.text().catch(() => "");
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
        const message = data?.message || `HTTP error ${res.status}`;
        const err = new Error(message);
        err.status = res.status;
        err.body = data;
        throw err;
    }
    return data;
}

export async function createThread({ title, categoryId, content, author }) {
    const url = `${API_BASE}/api/threads`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        // credentials: 'include', // เปิดถ้าคุณต้องส่ง cookie/session
        body: JSON.stringify({ title, categoryId, content, author }),
    });
    return handleResponse(res); // คาดหวัง body: { success: true, message: "...", thread: { ... } }
}

export async function getRecentThreads(limit = 10) {
    const url = `${API_BASE}/api/threads/recent?limit=${encodeURIComponent(limit)}`;
    const res = await fetch(url, { method: "GET" });
    return handleResponse(res);
}

export default { createThread, getRecentThreads };