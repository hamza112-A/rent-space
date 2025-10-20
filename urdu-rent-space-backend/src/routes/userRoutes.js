const express = require('express');
const {
  getProfile,
  updateProfile,
  getUserStats,
  getPublicProfile,
  getVerificationStatus,
  uploadIDDocument,
  verifyBiometric,
  getReviews,
  addReview
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