const API ="http://localhost:8080";  //---->URL จากBackEND

export async function sendLogin({ username, password } ) {
    const res = await fetch(`${API}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}
// singUp API
export async function sendRegister({ username, password } ) {
    const res = await fetch(`${API}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}



// export async function getEcho(text) {
//     const res = await fetch(`${API}/api/echo?text=${encodeURIComponent(text)}`);
//     if (!res.ok) throw new Error(`HTTP ${res.status}`);
//     return res.json();
// }
