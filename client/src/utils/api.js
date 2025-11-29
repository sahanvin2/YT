import axios from 'axios';

// Use relative base so Create React App dev proxy forwards to backend without CORS issues
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Videos
export const getVideos = (params) => axios.get(`${API_URL}/videos`, { params });
export const getVideo = (id) => axios.get(`${API_URL}/videos/${id}`);
export const uploadVideo = (formData) => axios.post(`${API_URL}/videos`, formData);
export const presignPut = (fileName, contentType) => axios.post(`${API_URL}/uploads/presign`, { fileName, contentType });
export const createVideoFromUrl = (data) => axios.post(`${API_URL}/videos/create`, data);
export const updateVideo = (id, data) => axios.put(`${API_URL}/videos/${id}`, data);
export const deleteVideo = (id) => axios.delete(`${API_URL}/videos/${id}`);
export const likeVideo = (id) => axios.put(`${API_URL}/videos/${id}/like`);
export const dislikeVideo = (id) => axios.put(`${API_URL}/videos/${id}/dislike`);
export const addView = (id) => axios.put(`${API_URL}/videos/${id}/view`);
export const searchVideos = (query, params) => axios.get(`${API_URL}/videos/search?q=${query}`, { params });
export const getSearchSuggestions = (query, limit = 5) => axios.get(`${API_URL}/videos/search/suggestions?q=${query}&limit=${limit}`);
export const getTrendingVideos = () => axios.get(`${API_URL}/videos/trending`);
export const getDownloadUrl = (id, quality = 'orig') => axios.get(`${API_URL}/videos/${id}/download?quality=${quality}`);

// Comments
export const getComments = (videoId) => axios.get(`${API_URL}/videos/${videoId}/comments`);
export const addComment = (videoId, data) => axios.post(`${API_URL}/videos/${videoId}/comments`, data);
export const deleteComment = (id) => axios.delete(`${API_URL}/comments/${id}`);
export const likeComment = (id) => axios.put(`${API_URL}/comments/${id}/like`);
export const addReply = (id, data) => axios.post(`${API_URL}/comments/${id}/reply`, data);

// Users
export const getUserProfile = (id) => axios.get(`${API_URL}/users/${id}`);
export const updateProfile = (id, data) => axios.put(`${API_URL}/users/${id}`, data);
export const uploadAvatar = (id, formData) => axios.post(`${API_URL}/users/${id}/avatar`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const toggleSubscribe = (id) => axios.put(`${API_URL}/users/${id}/subscribe`);
export const getUserVideos = (id, params) => axios.get(`${API_URL}/users/${id}/videos`, { params });
export const getSubscriptions = () => axios.get(`${API_URL}/users/subscriptions`);
export const getWatchHistory = () => axios.get(`${API_URL}/users/history`);
export const addToHistory = (videoId) => axios.post(`${API_URL}/users/history/${videoId}`);
export const getLikedVideos = () => axios.get(`${API_URL}/users/liked`);
export const getSubscriptionVideos = (params) => axios.get(`${API_URL}/users/subscriptions/videos`, { params });
