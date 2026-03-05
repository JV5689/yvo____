/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            const role = localStorage.getItem('userRole');
            const coId = localStorage.getItem('companyId');

            if (coId === 'undefined' || coId === 'null') {
                localStorage.removeItem('companyId');
            }

            if (token && storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);

                if (role === 'employee' || parsedUser.role === 'employee') {
                    try {
                        const res = await api.get('/employee/auth/me');
                        const updatedUser = { ...parsedUser, ...res.data };
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                        setUser(updatedUser);
                    } catch (e) {
                        console.error("Profile refresh failed", e);
                    }
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        console.log("Login Response Data:", res.data);
        const { token, currentCompanyId, ...userData } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        if (currentCompanyId) {
            localStorage.setItem('companyId', currentCompanyId);
        }

        setUser(userData);
        return userData;
    };

    const registerCompany = async (data) => {
        const res = await api.post('/auth/register-company', data);
        const { token, companyId, ...userData } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('companyId', companyId);

        setUser(userData);
        return userData;
    };

    const loginSuperAdmin = async (username, password) => {
        const res = await api.post('/admin/login', { username, password });
        console.log("Super Admin Login Response Data:", res.data);
        const { token, ...userData } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        // Ensure regular companyId isn't lingering
        localStorage.removeItem('companyId');

        setUser(userData);
        return userData;
    };

    const loginEmployee = async (phone, password) => {
        console.log("AuthContext: loginEmployee called", phone);
        const res = await api.post('/employee/auth/login', { phone, password });
        console.log("AuthContext: loginEmployee response", res.data);
        const { token, user: userData } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userRole', 'employee'); // Set role for interceptors

        // Employee might not need companyId locally if backend handles it via token
        if (userData.company) {
            const coId = typeof userData.company === 'string'
                ? userData.company
                : (userData.company.id || userData.company._id);
            if (coId) localStorage.setItem('companyId', coId);
        }

        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('companyId');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, loginSuperAdmin, loginEmployee, logout, registerCompany }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
