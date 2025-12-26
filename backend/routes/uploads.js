const express = require('express');
const { presignUpload } = require('../controllers/uploadController');
const { protect, requireUploadAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/presign', protect, requireUploadAdmin, presignUpload);

module.exports = router;
