const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createDispute,
  getMyDisputes,
  getDispute,
  addDisputeMessage,
  respondToDispute,
  getAllDisputes,
  assignDispute,
  updateDisputeStatus,
  resolveDispute,
  closeDispute,
  getDisputeStatistics
} = require('../controllers/disputeController');

// Public/User routes
router.post('/', protect, createDispute);
router.get('/my-disputes', protect, getMyDisputes);
router.get('/:id', protect, getDispute);
router.post('/:id/messages', protect, addDisputeMessage);
router.post('/:id/respond', protect, respondToDispute);

// Admin routes
router.get('/admin/all', protect, authorize('admin', 'superadmin'), getAllDisputes);
router.get('/admin/statistics', protect, authorize('admin', 'superadmin'), getDisputeStatistics);
router.put('/:id/assign', protect, authorize('superadmin'), assignDispute);
router.put('/:id/status', protect, authorize('admin', 'superadmin'), updateDisputeStatus);
router.put('/:id/resolve', protect, authorize('superadmin'), resolveDispute);
router.put('/:id/close', protect, authorize('admin', 'superadmin'), closeDispute);

module.exports = router;
