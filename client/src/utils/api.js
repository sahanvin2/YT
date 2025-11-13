import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Videos
export const getVideos = (params) => axios.get(`${API_URL}/videos`, { params });
export const getVideo = (id) => axios.get(`${API_URL}/videos/${id}`);
export const uploadVideo = (formData) => axios.post(`${API_URL}/videos`, formData);
export const updateVideo = (id, data) => axios.put(`${API_URL}/videos/${id}`, data);
export const deleteVideo = (id) => axios.delete(`${API_URL}/videos/${id}`);
export const likeVideo = (id) => axios.put(`${API_URL}/videos/${id}/like`);
export const dislikeVideo = (id) => axios.put(`${API_URL}/videos/${id}/dislike`);
export const addView = (id) => axios.put(`${API_URL}/videos/${id}/view`);
export const searchVideos = (query, params) => axios.get(`${API_URL}/videos/search?q=${query}`, { params });
export const getTrendingVideos = () => axios.get(`${API_URL}/videos/trending`);

// Comments
export const getComments = (videoId) => axios.get(`${API_URL}/videos/${videoId}/comments`);
export const addComment = (videoId, data) => axios.post(`${API_URL}/videos/${videoId}/comments`, data);
export const deleteComment = (id) => axios.delete(`${API_URL}/comments/${id}`);
export const likeComment = (id) => axios.put(`${API_URL}/comments/${id}/like`);
export const addReply = (id, data) => axios.post(`${API_URL}/comments/${id}/reply`, data);

// Users
export const getUserProfile = (id) => axios.get(`${API_URL}/users/${id}`);
export const updateProfile = (id, data) => axios.put(`${API_URL}/users/${id}`, data);
export const toggleSubscribe = (id) => axios.put(`${API_URL}/users/${id}/subscribe`);
export const getUserVideos = (id, params) => axios.get(`${API_URL}/users/${id}/videos`, { params });
export const getSubscriptions = () => axios.get(`${API_URL}/users/subscriptions`);
export const getWatchHistory = () => axios.get(`${API_URL}/users/history`);
export const addToHistory = (videoId) => axios.post(`${API_URL}/users/history/${videoId}`);
