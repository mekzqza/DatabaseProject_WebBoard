import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

import { AuthProvider } from './Components/AuthProvider';
import ForumDashboard from './Components/ForumDashboard';
import LoginPage from './Components/LoginPage';
import SignUpPage from './Components/SignUpPage';
import Profile from './Components/Profile';
import EditProfile from './Components/EditProfile';

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<ForumDashboard />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/edit" element={<EditProfile />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}
