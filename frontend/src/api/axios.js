import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh' && originalRequest.url !== '/auth/login') {
      originalRequest._retry = true;
      try {
        // Use default axios to prevent infinite interceptor loops!
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        if (res.status === 200) {
          const { access_token } = res.data;
          setAuthToken(access_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (err) {
        setAuthToken(null);
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
           window.location.href = '/login';
        }
      }
    } else if (error.response?.data?.error) {
      window.dispatchEvent(new CustomEvent('api-error', { detail: error.response.data.error }));
    }
    return Promise.reject(error);
  }
);

export default api;
