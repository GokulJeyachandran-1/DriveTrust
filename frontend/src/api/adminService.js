import api from './axios';

export const getAdminDashboard = async () => {
  const res = await api.get('/admin/dashboard');
  return res.data;
};

export const getAdminUsers = async (filters = {}) => {
  // Filter out undefined/empty values to prevent sending ?kycStatus=undefined
  const clean = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v));
  const params = new URLSearchParams(clean).toString();
  const res = await api.get(`/admin/users${params ? `?${params}` : ''}`);
  return res.data;
};

export const getUserKyc = async (userId) => {
  const res = await api.get(`/admin/users/${userId}/kyc`);
  return res.data;
};

export const updateKycStatus = async (userId, status) => {
  const res = await api.put(`/admin/users/${userId}/kyc`, { status });
  return res.data;
};

export const getAdminTrips = async () => {
  const res = await api.get('/admin/trips');
  return res.data;
};

export const getAdminSos = async () => {
  const res = await api.get('/admin/sos');
  return res.data;
};

export const resolveSos = async (id) => {
  const res = await api.put(`/admin/sos/${id}/resolve`);
  return res.data;
};

export const getAdminPayments = async () => {
  const res = await api.get('/admin/payments');
  return res.data;
};

export const releasePayment = async (id) => {
  const res = await api.put(`/admin/payments/${id}/release`);
  return res.data;
};

export const getAdminDeductions = async () => {
  const res = await api.get('/admin/deductions');
  return res.data;
};

export const reviewDeduction = async (id, status) => {
  const res = await api.put(`/admin/deductions/${id}`, { status });
  return res.data;
};
