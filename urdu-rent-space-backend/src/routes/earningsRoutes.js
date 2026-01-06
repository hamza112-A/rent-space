const express = require('express');
const {
  getEarningsSummary,
  getEarningsTransactions,
  requestPayout,
  getPayoutMethods,
  addPayoutMethod
} = require('../controllers/earningsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Allow all authenticated users to view earnings (they'll only see their own)
router.get('/summary', getEarningsSummary);
router.get('/transactions', getEarningsTransactions);

// Payout routes require owner/both role
router.post('/payout', authorize('owner', 'both'), requestPayout);
router.get('/payout-methods', getPayoutMethods);
router.post('/payout-methods', addPayoutMethod);

module.exports = router;