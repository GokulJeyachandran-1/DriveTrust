import api from './axios';

export const getOpenLoads = async () => {
    const res = await api.get('/driver/loads/open');
    return res.data;
};

export const submitBid = async (id, bidData) => {
    const res = await api.post(`/driver/loads/${id}/bid`, bidData);
    return res.data;
};
