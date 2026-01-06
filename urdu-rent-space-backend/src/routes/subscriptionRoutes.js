const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Payment = require('../models/Payment');
const asyncHandler = require('../middleware/asyncHandler');

// Subscription Plans Configuration
const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    nameUrdu: 'مفت',
    price: 0,
    currency: 'PKR',
    maxListings: 5,
    listingDuration: 48, // hours
    features: {
      prioritySupport: false,
      enhancedVisibility: false,
      analytics: false,
      featuredBadge: false,
      topVisibility: false
    },
    benefits: [
      '5 listings',
      'Basic support',
      'Standard visibility'
    ],
    limitations: [
      'Limited to 5 listings',
      'Listings expire after 48 hours',
      'Standard visibility only',
      'Basic support'
    ]
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    nameUrdu: 'بنیادی',
    price: 999,
    currency: 'PKR',
    period: 'month',
    maxListings: 20,
    listingDuration: 720, // 30 days in hours
    features: {
      prioritySupport: true,
      enhancedVisibility: true,
      analytics: true,
      featuredBadge: false,
      topVisibility: false
    },
    benefits: [
      '20 listings',
      'Priority support',
      'Enhanced visibility',
      'Analytics dashboard',
      'Listings active for 30 days'
    ],
    limitations: []
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    nameUrdu: 'پریمیم',
    price: 2499,
    currency: 'PKR',
    period: 'month',
    maxListings: -1, // unlimited
    listingDuration: -1, // never expires
    features: {
      prioritySupport: true,
      enhancedVisibility: true,
      analytics: true,
      featuredBadge: true,
      topVisibility: true
    },
    benefits: [
      'Unlimited listings',
      '24/7 support',
      'Top visibility',
      'Advanced analytics',
      'Featured badge',
      'Listings never expire'
    ],
    limitations: []
  }
};

// @route   GET /api/v1/subscriptions/plans
// Get all subscription plans
router.get('/plans', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: Object.values(SUBSCRIPTION_PLANS)
  });
}));

// @route   GET /api/v1/subscriptions/current
// Get current user's subscription
router.get('/current', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  const currentPlan = user.subscription?.plan || 'free';
  const planDetails = SUBSCRIPTION_PLANS[currentPlan] || SUBSCRIPTION_PLANS.free;
  
  // If user's subscription data doesn't match plan details, sync it
  const needsSync = 
    user.subscription?.maxListings !== planDetails.maxListings ||
    user.subscription?.listingDuration !== planDetails.listingDuration;
  
  if (needsSync) {
    user.subscription = {
      ...user.subscription,
      plan: currentPlan,
      maxListings: planDetails.maxListings,
      listingDuration: planDetails.listingDuration,
      features: planDetails.features
    };
    await user.save();
  }
  
  res.json({
    success: true,
    data: {
      plan: currentPlan,
      status: user.subscription?.status || 'active',
      startDate: user.subscription?.startDate,
      endDate: user.subscription?.endDate,
      autoRenew: user.subscription?.autoRenew || false,
      maxListings: planDetails.maxListings,
      listingDuration: planDetails.listingDuration,
      features: planDetails.features,
      planDetails
    }
  });
}));

// @route   POST /api/v1/subscriptions/sync
// Sync user subscription with plan details (admin or self)
router.post('/sync', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const currentPlan = user.subscription?.plan || 'free';
  const planDetails = SUBSCRIPTION_PLANS[currentPlan] || SUBSCRIPTION_PLANS.free;
  
  user.subscription = {
    plan: currentPlan,
    status: user.subscription?.status || 'active',
    startDate: user.subscription?.startDate || new Date(),
    endDate: user.subscription?.endDate,
    autoRenew: user.subscription?.autoRenew || false,
    maxListings: planDetails.maxListings,
    listingDuration: planDetails.listingDuration,
    features: planDetails.features
  };
  
  await user.save();
  
  res.json({
    success: true,
    message: 'Subscription synced successfully',
    data: {
      plan: user.subscription.plan,
      maxListings: user.subscription.maxListings,
      listingDuration: user.subscription.listingDuration,
      features: user.subscription.features
    }
  });
}));

// @route   POST /api/v1/subscriptions/subscribe
// Subscribe to a plan
router.post('/subscribe', protect, asyncHandler(async (req, res) => {
  const { planId, paymentIntentId } = req.body;
  
  if (!planId || !['basic', 'premium'].includes(planId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Valid plan ID is required (basic or premium)' 
    });
  }

  const plan = SUBSCRIPTION_PLANS[planId];
  const user = await User.findById(req.user._id);

  // For paid plans, verify payment
  if (plan.price > 0) {
    if (!paymentIntentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment is required for this plan' 
      });
    }

    // Verify payment was successful
    const payment = await Payment.findOne({ 
      stripePaymentIntentId: paymentIntentId,
      payer: req.user._id,
      status: 'completed'
    });

    if (!payment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed' 
      });
    }
  }

  // Calculate subscription end date (1 month from now)
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  // Update user subscription
  user.subscription = {
    plan: planId,
    status: 'active',
    startDate,
    endDate,
    autoRenew: false,
    maxListings: plan.maxListings,
    listingDuration: plan.listingDuration,
    features: plan.features
  };

  await user.save();

  res.json({
    success: true,
    message: `Successfully subscribed to ${plan.name} plan`,
    data: {
      plan: user.subscription.plan,
      status: user.subscription.status,
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
      features: user.subscription.features
    }
  });
}));

// @route   POST /api/v1/subscriptions/cancel
// Cancel subscription (reverts to free plan at end of period)
router.post('/cancel', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.subscription.plan === 'free') {
    return res.status(400).json({ 
      success: false, 
      message: 'You are already on the free plan' 
    });
  }

  user.subscription.autoRenew = false;
  user.subscription.status = 'cancelled';
  await user.save();

  res.json({
    success: true,
    message: 'Subscription cancelled. You will retain access until the end of your billing period.',
    data: {
      plan: user.subscription.plan,
      status: user.subscription.status,
      endDate: user.subscription.endDate
    }
  });
}));

// @route   POST /api/v1/subscriptions/create-payment
// Create payment intent for subscription
router.post('/create-payment', protect, asyncHandler(async (req, res) => {
  const { planId } = req.body;

  if (!planId || !['basic', 'premium'].includes(planId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Valid plan ID is required' 
    });
  }

  const plan = SUBSCRIPTION_PLANS[planId];
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  // Create Stripe Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: plan.price * 100, // Convert to paisa
    currency: 'pkr',
    metadata: {
      userId: req.user._id.toString(),
      planId,
      type: 'subscription'
    },
    description: `${plan.name} Plan Subscription`
  });

  // Create payment record
  const payment = await Payment.create({
    payer: req.user._id,
    method: 'stripe',
    status: 'pending',
    amount: {
      subtotal: plan.price,
      total: plan.price,
      currency: 'PKR'
    },
    stripePaymentIntentId: paymentIntent.id,
    description: `${plan.name} Plan Subscription`
  });

  res.json({
    success: true,
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment._id,
      amount: plan.price
    }
  });
}));

// @route   GET /api/v1/subscriptions/check-limits
// Check if user can create more listings
router.get('/check-limits', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const Listing = require('../models/Listing');
  
  const activeListings = await Listing.countDocuments({ 
    owner: req.user._id, 
    status: 'active' 
  });

  const maxListings = user.subscription.maxListings;
  const canCreateListing = maxListings === -1 || activeListings < maxListings;

  res.json({
    success: true,
    data: {
      plan: user.subscription.plan,
      activeListings,
      maxListings: maxListings === -1 ? 'Unlimited' : maxListings,
      canCreateListing,
      listingDuration: user.subscription.listingDuration
    }
  });
}));

module.exports = router;
module.exports.SUBSCRIPTION_PLANS = SUBSCRIPTION_PLANS;
