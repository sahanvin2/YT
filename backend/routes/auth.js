const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
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
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Google OAuth routes
router.get('/google', (req, res, next) => {
  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?error=google_oauth_not_configured`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        console.error('Google OAuth error:', err);
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?error=google_auth_error`);
      }
      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?error=google_auth_failed`);
      }
      
      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
      });

      // Redirect to frontend with token
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
    })(req, res, next);
  }
);

// Microsoft OAuth routes
router.get('/microsoft', (req, res, next) => {
  // Check if Microsoft OAuth is configured
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?error=microsoft_oauth_not_configured`);
  }
  passport.authenticate('microsoft', { scope: ['user.read'] })(req, res, next);
});

router.get(
  '/microsoft/callback',
  (req, res, next) => {
    passport.authenticate('microsoft', { session: false }, (err, user, info) => {
      if (err) {
        console.error('Microsoft OAuth error:', err);
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?error=microsoft_auth_error`);
      }
      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?error=microsoft_auth_failed`);
      }
      
      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
      });

      // Redirect to frontend with token
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
    })(req, res, next);
  }
);

module.exports = router;
