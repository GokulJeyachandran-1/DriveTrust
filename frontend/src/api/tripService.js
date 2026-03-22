import api from './axios';

export const getTrips = async () => {
    const res = await api.get('/trips');
    return res.data;
};

export const updateTripStatus = async (id, status) => {
    const res = await api.patch(`/trips/${id}/status`, { status });
    return res.data;
};
