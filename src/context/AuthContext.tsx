import React, { createContext, useContext, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

import { Role } from '../hooks/useRoles';

export interface DBPermission {
    database: string;
    table: string;
    privileges: ('READ' | 'WRITE' | 'DELETE' | 'EXECUTE')[];
    type: 'permanent' | 'temp' | 'expiring';
    expiry?: string;
}

export interface User {
    id: string;
    name: string;
    role: string | Role;
    db_username: string;
    status: 'active' | 'inactive';
    isSessionBased: boolean;
    lastLogin: string;
    permissions: DBPermission[];
    savedScripts: any[];
    queryTabs: any[];
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, password?: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const [token, setToken] = useState<string | null>(localStorage.getItem('sdb_token'));

    // Initialize user from localStorage if available
    const getStoredUser = () => {
        const stored = localStorage.getItem('sdb_user');
        try {
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    };

    // Verify token and fetch user on mount
    const { data: user, isLoading } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            if (!token) return null;
            try {
                // Try to fetch fresh user data
                const res = await apiClient.get('/users/me'); // Expecting /users/me to be implemented
                const userData = res.data;

                // Update local storage with fresh data
                localStorage.setItem('sdb_user', JSON.stringify(userData));
                return userData;
            } catch (e: any) {
                // If 401 (Unauthorized) or 400 (Bad Request), clear token
                if (e.response?.status === 401 || e.response?.status === 400) {
                    setToken(null);
                    localStorage.removeItem('sdb_token');
                    localStorage.removeItem('sdb_user');
                    return null;
                }
                // For other errors (404, 500), return stored user if available to prevent logout
                // This assumes the token is valid but the endpoint failed
                const storedUser = getStoredUser();
                if (storedUser) return storedUser;

                return null;
            }
        },
        enabled: !!token,
        retry: false,
        initialData: getStoredUser()
    });

    const loginMutation = useMutation({
        mutationFn: async ({ username, password }: { username: string, password?: string }) => {
            const res = await apiClient.post('/auth/login', { username, password });
            return res.data;
        },
        onSuccess: (data) => {
            const { token, user } = data.data;
            setToken(token);
            localStorage.setItem('sdb_token', token);
            localStorage.setItem('sdb_user', JSON.stringify(user));
            queryClient.setQueryData(['me'], user);
        }
    });

    const logout = () => {
        setToken(null);
        localStorage.removeItem('sdb_token');
        localStorage.removeItem('sdb_user');
        queryClient.setQueryData(['me'], null);
        queryClient.clear();
    };

    const login = async (username: string, password?: string) => {
        try {
            await loginMutation.mutateAsync({ username, password });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{
            user: user || null,
            isAuthenticated: !!user,
            login,
            logout,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
