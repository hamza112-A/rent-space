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

// All routes require authentication and owner/both role
router.use(protect);
router.use(authorize('owner', 'both'));

router.get('/summary', getEarningsSummary);
router.get('/transactions', getEarningsTransactions);
router.post('/payout', requestPayout);
router.get('/payout-methods', getPayoutMethods);
router.post('/payout-methods', addPayoutMethod);

module.exports = router;