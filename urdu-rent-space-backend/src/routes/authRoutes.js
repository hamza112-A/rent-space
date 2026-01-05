const express = require('express');
const {
  register,
  login,
  verifyOTP,
  resendOTP,
  selectRole,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
  deleteAccount,
  setup2FA,
  verify2FA,
  disable2FA,
  get2FAStatus,
  regenerateBackupCodes
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/select-role', selectRole);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);
router.delete('/delete-account', protect, deleteAccount);

// 2FA routes
router.get('/2fa/status', protect, get2FAStatus);
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);
router.post('/2fa/backup-codes', protect, regenerateBackupCodes);

module.exports = router;