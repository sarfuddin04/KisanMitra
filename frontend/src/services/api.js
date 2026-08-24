import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kisanmitra_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't loop if already on login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('kisanmitra_token');
        localStorage.removeItem('kisanmitra_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
