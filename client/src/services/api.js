import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:5099/api',
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
