import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const raw = sessionStorage.getItem('user');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    });

    const [token, setToken] = useState(() => {
        try {
            return sessionStorage.getItem('token') || null;
        } catch (e) {
            return null;
        }
    });

    useEffect(() => {
        if (user) {
            sessionStorage.setItem('user', JSON.stringify(user));
        } else {
            sessionStorage.removeItem('user');
        }
    }, [user]);

    useEffect(() => {
        if (token) {
            try { sessionStorage.setItem('token', token); } catch (e) { /* ignore */ }
        } else {
            sessionStorage.removeItem('token');
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
