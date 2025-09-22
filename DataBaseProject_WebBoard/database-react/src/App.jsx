import {useState,useEffect} from "react";
import './App.css';


import { sendLogin, getEcho } from './Components/APIs/api';

function App() {


    const [username, setU] = useState("");
    const [password, setP] = useState("");
    const [text, setText]   = useState("");
    const [out, setOut]     = useState("");

    async function onLogin(e) {
        e.preventDefault();
        try {
            const data = await sendLogin({ username, password });
            setOut(JSON.stringify(data, null, 2));
        } catch (err) { setOut("Error: " + err.message); }
    }

    async function onEcho() {
        try {
            const data = await getEcho(text);
            setOut(JSON.stringify(data, null, 2));
        } catch (err) { setOut("Error: " + err.message); }
    }


    return (
        <div style={{ padding: 16 }}>
            <h3>POST /api/submit</h3>
            <form onSubmit={onLogin}>
                <input placeholder="username" value={username} onChange={e=>setU(e.target.value)} />
                <input placeholder="password" type="password" value={password} onChange={e=>setP(e.target.value)} />
                <button type="submit">ส่ง</button>
            </form>

            <h3 style={{marginTop:24}}>GET /api/echo?text=...</h3>
            <input placeholder="ข้อความ" value={text} onChange={e=>setText(e.target.value)} />
            <button onClick={onEcho}>ส่งด้วย GET</button>

            <pre style={{marginTop:24}}>{out}</pre>
        </div>
    );
}

export default App;
