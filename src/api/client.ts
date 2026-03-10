// Copyright (c) 2026 Sai Mouli Bandari Licensed under Business Source License 1.1.
import axios from 'axios';

const API_URL = (window as any)._env_?.API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8080/v1';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('sdb_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401s
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token
            localStorage.removeItem('sdb_token');
            // Dispatch custom event for logout
            window.dispatchEvent(new CustomEvent('sdb-logout'));
        }
        return Promise.reject(error);
    }
);

export default apiClient;
/** Named export for plan/docs consistency */
export const api = apiClient;
