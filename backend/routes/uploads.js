const express = require('express');
const { presignUpload, createVideoFromB2 } = require('../controllers/uploadController');
const { protect, requireUploadAdmin } = require('../middleware/auth');

const router = express.Router();

// Get presigned URL for direct B2 upload (bypasses EC2)
router.post('/presign', protect, requireUploadAdmin, presignUpload);

// Create video record after direct B2 upload completes (metadata only, no files)
router.post('/create-from-b2', protect, requireUploadAdmin, createVideoFromB2);

module.exports = router;
