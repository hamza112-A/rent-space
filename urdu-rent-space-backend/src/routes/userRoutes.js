const express = require('express');
const {
  getProfile,
  updateProfile,
  getUserStats,
  getDashboardOverview,
  getPublicProfile,
  getVerificationStatus,
  uploadIDDocument,
  verifyBiometric,
  getReviews,
  addReview,
  searchUsers,
  toggleBlock,
  reportUser
} = require('../controllers/userController');
const { protect, requireEmailVerification, requirePhoneVerification } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');

const router = express.Router();

// Protected routes
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.patch('/profile', uploadMultiple.single('avatar'), updateProfile);
router.get('/stats', getUserStats);
router.get('/dashboard-overview', getDashboardOverview);

// Search users (for disputes, messages, etc.)
router.get('/search', searchUsers);

// Safety controls (see docs/redesign/06-messages.md)
router.post('/:id/block', toggleBlock);
router.post('/:id/report', reportUser);

// Verification routes
router.get('/verification', getVerificationStatus);
router.post('/verification/id', 
  requireEmailVerification,
  requirePhoneVerification,
  uploadMultiple.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
  ]),
  uploadIDDocument
);
router.post('/verification/biometric',
  requireEmailVerification,
  requirePhoneVerification,
  uploadMultiple.fields([
    { name: 'selfieImage', maxCount: 1 },
    { name: 'livenessVideo', maxCount: 1 }
  ]),
  verifyBiometric
);

// Public routes (but can be accessed with optional auth)
router.get('/:id', getPublicProfile);
router.get('/:id/reviews', getReviews);
router.post('/:id/reviews', addReview);

module.exports = router;