import {useState,useEffect} from "react";
import './App.css';
import Mybutton from "./Components/Mybutton";

function App() {
    const [msg, setMsg] = useState("");

    useEffect(() => {
        fetch("http://localhost:8080/api/message") // เรียก API จาก backend
            .then((res) => res.json())
            .then((data) => setMsg(data.message))
            .catch((err) => console.error("Error:", err));
    }, []);

    return (
        <div>
            <h1>ข้อความจาก Backend:</h1>
            <p>{msg}</p>
        </div>
    );
}

export default App;
