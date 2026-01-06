const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

// Initialize Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @route   GET /api/v1/payments
router.get('/', protect, asyncHandler(async (req, res) => {
  const payments = await Payment.find({
    $or: [{ payer: req.user._id }, { payee: req.user._id }]
  })
    .populate('booking', 'startDate endDate')
    .populate('listing', 'title')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: payments });
}));

// @route   GET /api/v1/payments/methods
router.get('/methods', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const paymentMethods = user.paymentMethods || [];
  res.json({ success: true, data: paymentMethods });
}));

// @route   POST /api/v1/payments/methods
router.post('/methods', protect, asyncHandler(async (req, res) => {
  const { type, details } = req.body;

  if (!type || !details) {
    return res.status(400).json({ success: false, message: 'Type and details are required' });
  }

  const user = await User.findById(req.user._id);
  
  if (!user.paymentMethods) {
    user.paymentMethods = [];
  }

  const newMethod = {
    _id: require('mongoose').Types.ObjectId(),
    type,
    details: {
      ...details,
      cardNumber: details.cardNumber ? `****${details.cardNumber.slice(-4)}` : undefined,
      accountNumber: details.accountNumber ? `****${details.accountNumber.slice(-4)}` : undefined,
    },
    isDefault: user.paymentMethods.length === 0,
    createdAt: new Date()
  };

  user.paymentMethods.push(newMethod);
  await user.save();

  res.status(201).json({ success: true, data: newMethod });
}));

// @route   DELETE /api/v1/payments/methods/:id
router.delete('/methods/:id', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user.paymentMethods) {
    return res.status(404).json({ success: false, message: 'Payment method not found' });
  }

  const methodIndex = user.paymentMethods.findIndex(m => m._id.toString() === req.params.id);
  
  if (methodIndex === -1) {
    return res.status(404).json({ success: false, message: 'Payment method not found' });
  }

  const wasDefault = user.paymentMethods[methodIndex].isDefault;
  user.paymentMethods.splice(methodIndex, 1);

  if (wasDefault && user.paymentMethods.length > 0) {
    user.paymentMethods[0].isDefault = true;
  }

  await user.save();
  res.json({ success: true, message: 'Payment method removed' });
}));

// @route   PUT /api/v1/payments/methods/:id/default
router.put('/methods/:id/default', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user.paymentMethods) {
    return res.status(404).json({ success: false, message: 'Payment method not found' });
  }

  user.paymentMethods.forEach(m => m.isDefault = false);

  const method = user.paymentMethods.find(m => m._id.toString() === req.params.id);
  if (!method) {
    return res.status(404).json({ success: false, message: 'Payment method not found' });
  }

  method.isDefault = true;
  await user.save();

  res.json({ success: true, data: method });
}));

// @route   POST /api/v1/payments/create-intent
// Create a Stripe Payment Intent
router.post('/create-intent', protect, asyncHandler(async (req, res) => {
  const { bookingId, amount, currency = 'pkr' } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid amount is required' });
  }

  // Get booking details if bookingId provided
  let booking = null;
  let listingOwner = null;
  if (bookingId) {
    booking = await Booking.findById(bookingId).populate('listing', 'title owner');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    // Get the owner from the booking or from the listing
    listingOwner = booking.owner || booking.listing?.owner;
  }

  // Create Stripe Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe expects amount in smallest currency unit (paisa for PKR)
    currency: currency.toLowerCase(),
    metadata: {
      bookingId: bookingId || '',
      userId: req.user._id.toString(),
      userEmail: req.user.email
    },
    description: booking ? `Booking for ${booking.listing?.title}` : 'Payment'
  });

  // Create payment record in database
  const payment = await Payment.create({
    booking: bookingId || null,
    payer: req.user._id,
    payee: listingOwner || null,
    listing: booking?.listing?._id || null,
    method: 'stripe',
    status: 'pending',
    amount: {
      subtotal: amount,
      serviceFee: 0,
      total: amount,
      currency: currency.toUpperCase()
    },
    stripePaymentIntentId: paymentIntent.id
  });

  res.json({
    success: true,
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment._id
    }
  });
}));

// @route   POST /api/v1/payments/confirm
// Confirm payment after Stripe processes it
router.post('/confirm', protect, asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    return res.status(400).json({ success: false, message: 'Payment Intent ID is required' });
  }

  // Retrieve payment intent from Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  // Find payment record
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
  
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment record not found' });
  }

  // Update payment status based on Stripe status
  if (paymentIntent.status === 'succeeded') {
    payment.status = 'completed';
    payment.completedAt = new Date();
    payment.transactionId = paymentIntent.id;
    
    // Set payout info for owner earnings
    payment.payout = {
      amount: payment.amount.total,
      status: 'pending'
    };
    
    await payment.save();

    // Update booking status if linked
    if (payment.booking) {
      const booking = await Booking.findByIdAndUpdate(payment.booking, {
        paymentStatus: 'paid',
        status: 'completed', // Mark as completed so users can leave reviews
        completedAt: new Date()
      }, { new: true });
      
      // Ensure payee is set (owner of the listing)
      if (booking && !payment.payee) {
        payment.payee = booking.owner;
        await payment.save();
      }
    }

    return res.json({
      success: true,
      status: 'succeeded',
      message: 'Payment successful',
      data: payment
    });
  } else if (paymentIntent.status === 'requires_payment_method' || 
             paymentIntent.status === 'canceled') {
    payment.status = 'failed';
    await payment.save();

    return res.json({
      success: false,
      status: paymentIntent.status,
      message: 'Payment failed or was canceled'
    });
  } else {
    return res.json({
      success: false,
      status: paymentIntent.status,
      message: `Payment status: ${paymentIntent.status}`
    });
  }
}));

// @route   GET /api/v1/payments/status/:paymentIntentId
// Check payment status
router.get('/status/:paymentIntentId', protect, asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.params;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });

  res.json({
    success: true,
    data: {
      stripeStatus: paymentIntent.status,
      paymentRecord: payment
    }
  });
}));

// @route   GET /api/v1/payments/:id
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('booking')
    .populate('listing', 'title images')
    .populate('payer', 'fullName email')
    .populate('payee', 'fullName email');

  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  res.json({ success: true, data: payment });
}));

// @route   POST /api/v1/payments/initiate (Legacy - kept for compatibility)
router.post('/initiate', protect, asyncHandler(async (req, res) => {
  const { bookingId, method, amount } = req.body;

  const payment = await Payment.create({
    booking: bookingId,
    payer: req.user._id,
    method,
    status: 'pending',
    amount: { total: amount, currency: 'PKR' }
  });

  res.status(201).json({
    success: true,
    data: payment,
    message: 'Payment initiated. Complete payment to confirm booking.'
  });
}));

// @route   POST /api/v1/payments/webhook
// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Update payment record
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        { status: 'completed', paidAt: new Date(), transactionId: paymentIntent.id }
      );
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: failedPayment.id },
        { status: 'failed' }
      );
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
