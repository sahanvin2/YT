const express = require('express');
const { presignUpload, createVideoFromB2, streamUploadToB2 } = require('../controllers/uploadController');
const { protect, requireUploadAdmin } = require('../middleware/auth');

const router = express.Router();

// Stream upload - receives file and streams directly to B2 (no CORS issues, no EC2 storage)
router.post('/stream', protect, requireUploadAdmin, streamUploadToB2);

// Get presigned URL for direct B2 upload (bypasses EC2) - may have CORS issues
router.post('/presign', protect, requireUploadAdmin, presignUpload);

// Create video record after direct B2 upload completes (metadata only, no files)
router.post('/create-from-b2', protect, requireUploadAdmin, createVideoFromB2);

module.exports = router;
