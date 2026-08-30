const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  createDispute,
  getMyDisputes,
  getDispute,
  addDisputeMessage,
  getAllDisputes,
  assignDispute,
  updateDisputeStatus,
  resolveDispute,
  closeDispute,
  getDisputeStatistics
} = require('../controllers/disputeController');

// Public/User routes
router.post('/', protect, upload.array('evidence', 5), createDispute);
router.get('/my-disputes', protect, getMyDisputes);
router.get('/:id', protect, getDispute);
router.post('/:id/messages', protect, addDisputeMessage);
// Note: respondToDispute removed - disputes go to super admin, not respondent directly

// Admin routes
router.get('/admin/all', protect, authorize('admin', 'superadmin'), getAllDisputes);
router.get('/admin/statistics', protect, authorize('admin', 'superadmin'), getDisputeStatistics);
// Assigning/triaging a dispute isn't a financial action, so 'support' admins
// can do it too — only resolving (which can trigger a real refund, see
// disputeController.resolveDispute) is kept superadmin-only.
router.put('/:id/assign', protect, authorize('admin', 'superadmin'), assignDispute);
router.put('/:id/status', protect, authorize('admin', 'superadmin'), updateDisputeStatus);
router.put('/:id/resolve', protect, authorize('superadmin'), resolveDispute);
router.put('/:id/close', protect, authorize('admin', 'superadmin'), closeDispute);

module.exports = router;
