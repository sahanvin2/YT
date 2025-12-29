import api from '../config/api';

// API instance is configured with auth interceptors in config/api.js
const API_URL = ''; // Empty since baseURL is set in api instance

// Videos
export const getVideos = (params) => api.get(`${API_URL}/videos`, { params });
export const getVideo = (id) => api.get(`${API_URL}/videos/${id}`);
export const uploadVideo = (formData, config = {}) => {
  // Ensure we're using the correct API instance with proper base URL
  return api.post(`${API_URL}/videos`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: config.onUploadProgress,
    timeout: 36000000, // 10 hours for large video uploads
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });
};
export const presignPut = (fileName, contentType) => api.post(`${API_URL}/uploads/presign`, { fileName, contentType });
export const createVideoFromUrl = (data) => api.post(`${API_URL}/videos/create`, data);
export const updateVideo = (id, data) => api.put(`${API_URL}/videos/${id}`, data);
export const deleteVideo = (id) => api.delete(`${API_URL}/videos/${id}`);
export const likeVideo = (id) => api.put(`${API_URL}/videos/${id}/like`);
export const dislikeVideo = (id) => api.put(`${API_URL}/videos/${id}/dislike`);
export const addView = (id) => api.put(`${API_URL}/videos/${id}/view`);
export const searchVideos = (query, params) => api.get(`${API_URL}/videos/search?q=${query}`, { params });
export const getSearchSuggestions = (query, limit = 5) => api.get(`${API_URL}/videos/search/suggestions?q=${query}&limit=${limit}`);
export const getTrendingVideos = () => api.get(`${API_URL}/videos/trending`);
export const getTopCreators = (params) => api.get(`${API_URL}/videos/creators`, { params });
export const getDownloadUrl = (id, quality = 'orig') => api.get(`${API_URL}/videos/${id}/download?quality=${quality}`);

// Processing
export const getProcessingStatus = (id) => api.get(`${API_URL}/processing/${id}/status`);

// Comments
export const getComments = (videoId) => api.get(`${API_URL}/videos/${videoId}/comments`);
export const addComment = (videoId, data) => api.post(`${API_URL}/videos/${videoId}/comments`, data);
export const deleteComment = (id) => api.delete(`${API_URL}/comments/${id}`);
export const likeComment = (id) => api.put(`${API_URL}/comments/${id}/like`);
export const addReply = (id, data) => api.post(`${API_URL}/comments/${id}/reply`, data);

// Users
export const getUserProfile = (id) => api.get(`${API_URL}/users/${id}`);
export const updateProfile = (id, data) => api.put(`${API_URL}/users/${id}`, data);
export const uploadAvatar = (id, formData) => api.post(`${API_URL}/users/${id}/avatar`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const toggleSubscribe = (id) => api.put(`${API_URL}/users/${id}/subscribe`);
export const getUserVideos = (id, params) => api.get(`${API_URL}/users/${id}/videos`, { params });
export const getSubscriptions = () => api.get(`${API_URL}/users/subscriptions`);
export const getWatchHistory = () => api.get(`${API_URL}/users/history`);
export const addToHistory = (videoId) => api.post(`${API_URL}/users/history/${videoId}`);
export const getLikedVideos = () => api.get(`${API_URL}/users/liked`);
export const getSavedVideos = () => api.get(`${API_URL}/users/saved`);
export const saveVideo = (videoId) => api.post(`${API_URL}/users/saved/${videoId}`);
export const getSubscriptionVideos = (params) => api.get(`${API_URL}/users/subscriptions/videos`, { params });
export const uploadBanner = (id, formData) => api.post(`${API_URL}/users/${id}/banner`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateSettings = (id, settings) => api.put(`${API_URL}/users/${id}/settings`, { settings });

// Channels
export const createChannel = (data) => api.post(`${API_URL}/channels`, data);
export const getMyChannels = () => api.get(`${API_URL}/channels/my-channels`);
export const getChannel = (id) => api.get(`${API_URL}/channels/${id}`);
export const updateChannel = (id, data) => api.put(`${API_URL}/channels/${id}`, data);
export const deleteChannel = (id) => api.delete(`${API_URL}/channels/${id}`);

// Playlists
export const createPlaylist = (data) => api.post(`${API_URL}/playlists`, data);
export const getPlaylists = () => api.get(`${API_URL}/playlists`);
export const getPlaylist = (id) => api.get(`${API_URL}/playlists/${id}`);
export const updatePlaylist = (id, data) => api.put(`${API_URL}/playlists/${id}`, data);
export const deletePlaylist = (id) => api.delete(`${API_URL}/playlists/${id}`);
export const addVideoToPlaylist = (playlistId, videoId) => api.post(`${API_URL}/playlists/${playlistId}/videos/${videoId}`);
export const removeVideoFromPlaylist = (playlistId, videoId) => api.delete(`${API_URL}/playlists/${playlistId}/videos/${videoId}`);
