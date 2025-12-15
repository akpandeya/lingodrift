import axios from 'axios';

// Create axios instance
const client = axios.create({
    baseURL: '/api', // Proxied by Vite or Caddy
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the Token
client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401s (optional logout)
client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            // window.location.href = '/login'; // Optional: Redirect to login
        }
        return Promise.reject(error);
    }
);

export default client;
