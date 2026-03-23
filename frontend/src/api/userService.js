import api from './axios';

export const getUserProfile = async (id) => {
    const res = await api.get(`/users/${id}/profile`);
    return res.data;
};

export const getMyProfile = async () => {
    const res = await api.get('/users/me');
    return res.data;
};

export const updateMyProfile = async (data) => {
    const res = await api.put('/users/me', data);
    return res.data;
};
