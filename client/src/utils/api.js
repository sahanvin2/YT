import axios from 'axios';

// Use relative base so Create React App dev proxy forwards to backend without CORS issues
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Videos
export const getVideos = (params) => axios.get(`${API_URL}/videos`, { params });
export const getVideo = (id) => axios.get(`${API_URL}/videos/${id}`);
export const uploadVideo = (formData, config = {}) => axios.post(`${API_URL}/videos`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  },
  onUploadProgress: config.onUploadProgress,
  timeout: 600000 // 10 minutes for large files
});
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
export const getTopCreators = (params) => axios.get(`${API_URL}/videos/creators`, { params });
export const getDownloadUrl = (id, quality = 'orig') => axios.get(`${API_URL}/videos/${id}/download?quality=${quality}`);

// Processing
export const getProcessingStatus = (id) => axios.get(`${API_URL}/processing/${id}/status`);

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
export const getSavedVideos = () => axios.get(`${API_URL}/users/saved`);
export const saveVideo = (videoId) => axios.post(`${API_URL}/users/saved/${videoId}`);
export const getSubscriptionVideos = (params) => axios.get(`${API_URL}/users/subscriptions/videos`, { params });
export const uploadBanner = (id, formData) => axios.post(`${API_URL}/users/${id}/banner`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateSettings = (id, settings) => axios.put(`${API_URL}/users/${id}/settings`, { settings });

// Channels
export const createChannel = (data) => axios.post(`${API_URL}/channels`, data);
export const getMyChannels = () => axios.get(`${API_URL}/channels/my-channels`);
export const getChannel = (id) => axios.get(`${API_URL}/channels/${id}`);
export const updateChannel = (id, data) => axios.put(`${API_URL}/channels/${id}`, data);
export const deleteChannel = (id) => axios.delete(`${API_URL}/channels/${id}`);

// Playlists
export const createPlaylist = (data) => axios.post(`${API_URL}/playlists`, data);
export const getPlaylists = () => axios.get(`${API_URL}/playlists`);
export const getPlaylist = (id) => axios.get(`${API_URL}/playlists/${id}`);
export const updatePlaylist = (id, data) => axios.put(`${API_URL}/playlists/${id}`, data);
export const deletePlaylist = (id) => axios.delete(`${API_URL}/playlists/${id}`);
export const addVideoToPlaylist = (playlistId, videoId) => axios.post(`${API_URL}/playlists/${playlistId}/videos/${videoId}`);
export const removeVideoFromPlaylist = (playlistId, videoId) => axios.delete(`${API_URL}/playlists/${playlistId}/videos/${videoId}`);
