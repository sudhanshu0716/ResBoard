import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5005/api',
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Basic global error handling or token expiration logic
        if (error.response?.status === 401) {
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                localStorage.removeItem('username');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
