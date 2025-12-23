const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', logout);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerification);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

module.exports = router;
