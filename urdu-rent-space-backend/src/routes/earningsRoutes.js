const express = require('express');
const {
  getEarningsSummary,
  getEarningsTransactions,
  requestPayout,
  getPayoutMethods,
  addPayoutMethod
} = require('../controllers/earningsController');
const { protect, ownerOnly } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and owner role
router.use(protect);
router.use(ownerOnly);

// Earnings routes - only owners can have earnings
router.get('/summary', getEarningsSummary);
router.get('/transactions', getEarningsTransactions);

// Payout routes
router.post('/payout', authorize('owner', 'both'), requestPayout);
router.get('/payout-methods', getPayoutMethods);
router.post('/payout-methods', addPayoutMethod);

module.exports = router;