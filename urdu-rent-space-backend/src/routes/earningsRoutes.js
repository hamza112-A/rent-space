const express = require('express');
const {
  getEarningsSummary,
  getEarningsTransactions,
  requestPayout,
  getPayoutMethods,
  addPayoutMethod,
  deletePayoutMethod,
  getConnectStatus,
  createConnectOnboardingLink,
  refreshConnectStatus
} = require('../controllers/earningsController');
const { protect, ownerOnly } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and owner role
router.use(protect);
router.use(ownerOnly);

// Earnings routes - only owners can have earnings
router.get('/summary', getEarningsSummary);
router.get('/transactions', getEarningsTransactions);

// Payout routes - already protected by ownerOnly middleware above
router.post('/payout', requestPayout);
router.get('/payout-methods', getPayoutMethods);
router.post('/payout-methods', addPayoutMethod);
router.delete('/payout-methods/:id', deletePayoutMethod);

// Stripe Connect onboarding (sandbox/demo automated payout rail)
router.get('/connect/status', getConnectStatus);
router.post('/connect/onboard', createConnectOnboardingLink);
router.post('/connect/sync', refreshConnectStatus);

module.exports = router;
