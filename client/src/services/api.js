import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5099/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Automatically inject Authorization token if it exists in local storage
api.interceptors.request.use(
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

// Global response intercepts for handling common HTTP errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the token is invalid or expired (401), clean up storage
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
