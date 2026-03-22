import api from './axios';

export const getMyLoads = async () => {
    const res = await api.get('/customer/loads');
    return res.data;
};

export const createLoad = async (loadData) => {
    const res = await api.post('/customer/loads', loadData);
    return res.data;
};
