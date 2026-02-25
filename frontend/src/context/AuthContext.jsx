import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = () => {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role');
            const username = localStorage.getItem('username');

            if (token && username) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    setUser({ token, role, username, userId: payload.userId });
                } catch (e) {
                    setUser({ token, role, username });
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        const { token, role } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('username', username);

        let userId = null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.userId;
        } catch (e) { }

        setUser({ token, role, username, userId });
        return response.data;
    };

    const register = async (username, password, passkey, role) => {
        const response = await api.post('/auth/register', { username, password, passkey, role });
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
