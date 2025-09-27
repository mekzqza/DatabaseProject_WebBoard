// Simple Threads API helper with fallbacks and optional credentials
// Uses same base as other API helpers
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080";
const USE_CREDENTIALS = (process.env.REACT_APP_API_INCLUDE_CREDENTIALS === 'true');

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
    // merge Authorization if present
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

export async function getThreads() {
    const paths = [`${API_BASE}/threads`, `${API_BASE}/api/threads`];
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
export async function createThread({ title, content, categoryId, userId }) {
    if (!title || !content) throw new Error('title and content are required');

    const body = {
        title,
        content,
    };
    if (categoryId !== undefined && categoryId !== null) body.category_id = Number(categoryId);
    if (userId !== undefined && userId !== null) body.user_id = userId;

    const paths = [`${API_BASE}/threads`, `${API_BASE}/api/threads`];
    let lastError = null;
    for (const url of paths) {
        try {
            return await tryFetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        } catch (e) {
            lastError = e;
            // try next
        }
    }

    const err = new Error(lastError?.message || 'Failed to create thread');
    err.cause = lastError;
    throw err;
}
