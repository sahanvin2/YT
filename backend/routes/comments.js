const express = require('express');
const {
  getComments,
  addComment,
  deleteComment,
  likeComment,
  addReply
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(getComments)
  .post(protect, addComment);

router.delete('/:id', protect, deleteComment);
router.put('/:id/like', protect, likeComment);
router.post('/:id/reply', protect, addReply);

module.exports = router;
