import api from './axios';

export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const signup = async (formData) => {
  // formData is a FormData instance with files
  const res = await api.post('/auth/signup', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const logout = async () => {
  const res = await api.post('/auth/logout');
  return res.data;
};
