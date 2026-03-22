import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // For httpOnly refresh token cookies
});

// Interceptor to add Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor to handle 401 and transparently refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post('http://localhost:5000/api/auth/refresh', {}, { withCredentials: true });
        if (res.status === 200) {
          localStorage.setItem('access_token', res.data.access_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
          return api(originalRequest);
        }
      } catch (err) {
        // Refresh token failed, user must login again
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
