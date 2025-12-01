const express = require('express');
const {
  createPlaylist,
  getPlaylists,
  getPlaylist,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist
} = require('../controllers/playlistController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getPlaylists)
  .post(protect, createPlaylist);

router.route('/:id')
  .get(getPlaylist)
  .put(protect, updatePlaylist)
  .delete(protect, deletePlaylist);

router.post('/:id/videos/:videoId', protect, addVideoToPlaylist);
router.delete('/:id/videos/:videoId', protect, removeVideoFromPlaylist);

module.exports = router;

