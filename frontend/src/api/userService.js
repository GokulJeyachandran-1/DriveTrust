import api from './axios';

export const getUserProfile = async (id) => {
    const res = await api.get(`/users/${id}/profile`);
    return res.data;
};
