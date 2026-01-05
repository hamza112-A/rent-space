const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// Subscription plans
const plans = [
  {
    id: 'free',
    name: 'Free',
    name_ur: 'مفت',
    price: 0,
    features: ['5 listings', 'Basic support', 'Standard visibility'],
    listingLimit: 5
  },
  {
    id: 'basic',
    name: 'Basic',
    name_ur: 'بنیادی',
    price: 999,
    features: ['20 listings', 'Priority support', 'Enhanced visibility', 'Analytics'],
    listingLimit: 20
  },
  {
    id: 'premium',
    name: 'Premium',
    name_ur: 'پریمیم',
    price: 2499,
    features: ['Unlimited listings', '24/7 support', 'Top visibility', 'Advanced analytics', 'Featured badge'],
    listingLimit: -1
  }
];

// @route   GET /api/v1/subscriptions/plans
router.get('/plans', asyncHandler(async (req, res) => {
  res.json({ success: true, data: plans });
}));

// @route   GET /api/v1/subscriptions/current
router.get('/current', protect, asyncHandler(async (req, res) => {
  const subscription = {
    plan: req.user.subscription?.plan || 'free',
    expiresAt: req.user.subscription?.expiresAt,
    features: plans.find(p => p.id === (req.user.subscription?.plan || 'free'))?.features
  };

  res.json({ success: true, data: subscription });
}));

// @route   POST /api/v1/subscriptions/subscribe
router.post('/subscribe', protect, asyncHandler(async (req, res) => {
  const { planId } = req.body;

  const plan = plans.find(p => p.id === planId);
  if (!plan) {
    return res.status(400).json({ success: false, message: 'Invalid plan' });
  }

  // In production, integrate with payment gateway
  req.user.subscription = {
    plan: planId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  };
  await req.user.save();

  res.json({ success: true, data: req.user.subscription, message: 'Subscription activated' });
}));

// @route   POST /api/v1/subscriptions/cancel
router.post('/cancel', protect, asyncHandler(async (req, res) => {
  req.user.subscription = { plan: 'free', expiresAt: null };
  await req.user.save();

  res.json({ success: true, message: 'Subscription cancelled' });
}));

module.exports = router;
