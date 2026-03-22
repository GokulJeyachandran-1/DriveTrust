import api from './axios';

export const getTrips = async () => {
    const res = await api.get('/trips');
    return res.data;
};

export const updateTripStatus = async (id, status, location) => {
    const res = await api.put(`/trips/${id}/status`, { status, location });
    return res.data;
};

export const submitReview = async (reviewData) => {
    const res = await api.post('/reviews', reviewData);
    return res.data;
};

export const triggerSOS = async (tripId) => {
    const res = await api.post('/sos/raise', { tripId });
    return res.data;
};
