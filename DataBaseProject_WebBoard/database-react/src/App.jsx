import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

import LoginPage from './Components/LoginPage';
import DashboardPage from './Components/DashboardPage';
import SignUpPage from './Components/SignUpPage';

function App() {
    return (
        <Router>  {/* ห่อแอปทั้งหมดด้วย <Router> */}
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/signup" element={<SignUpPage />} />
            </Routes>
        </Router>
    );
}

export default App;
