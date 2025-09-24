import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

import LoginPage from './Components/LoginPage';
import ForumDashboard from './Components/ForumDashboard';
import SignUpPage from './Components/SignUpPage';

function App() {
    return (
        <Router>  {/* ห่อแอปทั้งหมดด้วย <Router> */}
            <Routes>
                <Route path="/" element={<ForumDashboard />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
            </Routes>
        </Router>
    );
}

export default App;
