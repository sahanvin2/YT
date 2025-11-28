const express = require('express');
const { presignUpload } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/presign', protect, presignUpload);

module.exports = router;
