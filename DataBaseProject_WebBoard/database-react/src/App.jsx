import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

import { AuthProvider } from './Components/AuthProvider';
import ForumDashboard from './Components/ForumDashboard';
import LoginPage from './Components/LoginPage';
import SignUpPage from './Components/SignUpPage';
import Profile from './Components/Profile';
import EditProfile from './Components/EditProfile';
import ForgotPassword from './Components/ForgotPassword';
import ThreadView from './Components/ThreadView';
import ThreadsReports from './Components/ThreadsReports';
import AdminPanel from './Components/AdminPanel';

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<ForumDashboard />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/forgotpassword" element={<ForgotPassword />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/edit" element={<EditProfile />} />
                    <Route path="/thread/:id" element={<ThreadView />} />
                    <Route path="/threads-reports" element={<ThreadsReports />} />
                    <Route path="/admin" element={<AdminPanel />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}
