// Simple Threads API helper with fallbacks and optional credentials
// Uses same base as other API helpers
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080";
const USE_CREDENTIALS = (process.env.REACT_APP_API_INCLUDE_CREDENTIALS === 'true');
///Test commit form 

function makeHeaders(isJson = true) {
    const headers = {};
    if (isJson) headers['Content-Type'] = 'application/json';
    // send token if stored (optional, depends on your auth flow)
    try {
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
        // ignore localStorage errors
    }
    return headers;
}

async function handleResponse(res) {
    if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) return await res.json();
        return await res.text();
    }

    let err = '';
    try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
            const j = await res.json();
            err = j && j.message ? j.message : JSON.stringify(j);
        } else {
            err = await res.text();
        }
    } catch (e) {
        // ignore
    }

    const message = err || `HTTP error ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
}

async function tryFetch(url, options = {}) {
    // set credentials if configured
    if (USE_CREDENTIALS) options.credentials = options.credentials || 'include';
    // add headers if missing
    options.headers = { ...(options.headers || {}) };
    if (!options.headers['Accept'] && !options.headers['Content-Type']) {
        options.headers['Accept'] = 'application/json';
    }
    // merge Authorization if present in localStorage
    const extraHeaders = makeHeaders(options.headers['Content-Type'] === 'application/json');
    options.headers = { ...extraHeaders, ...options.headers };

    try {
        const res = await fetch(url, options);
        return await handleResponse(res);
    } catch (e) {
        // rethrow so caller can decide fallback
        throw e;
    }
}

export async function getThreads(q = null) {
    // accept optional search query `q` — append as ?q=... to the candidate paths
    const basePaths = [`${API_BASE}/threads`, `${API_BASE}/api/threads`];
    const paths = (q && q.toString().trim()) ? basePaths.map(p => `${p}?q=${encodeURIComponent(q.toString().trim())}`) : basePaths;
    let lastError = null;
    for (const url of paths) {
        try {
            return await tryFetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
        } catch (e) {
            lastError = e;
            // try next
        }
    }
    // if we get here all attempts failed
    const err = new Error(lastError?.message || 'Failed to fetch threads');
    err.cause = lastError;
    throw err;
}

// payload: { title, content, categoryId, userId }
// token: optional JWT string to use instead of localStorage
export async function createThread({ title, content, categoryId, userId }, token = null) {
    if (!title || !content) throw new Error('title and content are required');

    const body = {
        title,
        content,
    };
    if (categoryId !== undefined && categoryId !== null) {
        const cid = Number(categoryId);
        if (!Number.isNaN(cid)) body.category_id = cid;
    }
    if (userId !== undefined && userId !== null) {
        const uid = Number(userId);
        // only send a positive integer user id
        if (!Number.isNaN(uid) && uid > 0) body.user_id = uid;
    }

    const paths = [`${API_BASE}/threads`, `${API_BASE}/api/threads`];
    let lastError = null;
    for (const url of paths) {
        try {
            // prepare headers
            const headers = { 'Content-Type': 'application/json' };
            // if token provided as argument, use it; otherwise let tryFetch merge from localStorage
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // call server
            const res = await tryFetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            // normalize common response envelopes
            if (!res) return res;
            if (res.thread) return res.thread;
            if (res.data) {
                if (Array.isArray(res.data) && res.data.length > 0) return res.data[0];
                if (res.data.thread) return res.data.thread;
                return res.data;
            }
            if (res.result) return res.result;

            return res;
        } catch (e) {
            lastError = e;
            // try next
        }
    }

    const err = new Error(lastError?.message || 'Failed to create thread');
    err.cause = lastError;
    throw err;
}
