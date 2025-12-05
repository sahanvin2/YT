const express = require('express');
const {
  createChannel,
  getMyChannels,
  getChannel,
  updateChannel,
  deleteChannel
} = require('../controllers/channelController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, createChannel);

router.get('/my-channels', protect, getMyChannels);

router.route('/:id')
  .get(getChannel)
  .put(protect, updateChannel)
  .delete(protect, deleteChannel);

module.exports = router;




