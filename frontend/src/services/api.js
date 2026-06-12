import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);

export const requestRide = (data) => API.post('/rides/request', data);
export const acceptRide = (id) => API.put(`/rides/${id}/accept`);
export const updateRideStatus = (id, status) => API.put(`/rides/${id}/status`, { status });
export const cancelRide = (id) => API.put(`/rides/${id}/cancel`);
export const getRideHistory = () => API.get('/rides/history');
export const getActiveRide = () => API.get('/rides/active');
export const rateRide = (id, data) => API.post(`/rides/${id}/rate`, data);
export const getAvailableDrivers = () => API.get('/rides/drivers/available');
export const getScheduledRides = () => API.get('/rides/scheduled');
export const getPendingRideRequests = () => API.get('/rides/pending');
export const getAllRides = () => API.get('/rides/all');

export const toggleAvailability = () => API.put('/driver/availability');
export const updateLocation = (data) => API.put('/driver/location', data);
export const getDriverStats = () => API.get('/driver/stats');
export const getDriverAnalytics = () => API.get('/driver/analytics');