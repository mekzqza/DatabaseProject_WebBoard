import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem('user');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    });

    const [token, setToken] = useState(() => {
        try {
            return localStorage.getItem('token') || null;
        } catch (e) {
            return null;
        }
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }, [user]);

    useEffect(() => {
        if (token) {
            try { localStorage.setItem('token', token); } catch (e) { /* ignore */ }
        } else {
            localStorage.removeItem('token');
        }
    }, [token]);

    const login = (userInfo) => {
        // Ensure joinDate exists (set to now if not provided)
        const now = new Date().toISOString();
        const merged = {
            ...(user || {}),
            ...userInfo,
            joinDate: (userInfo && userInfo.joinDate) || (user && user.joinDate) || now,
        };
        setUser(merged);
        // if token provided inside userInfo, store it in context/localStorage
        if (userInfo && userInfo.token) {
            setToken(userInfo.token);
        }
    };
    const logout = () => {
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
