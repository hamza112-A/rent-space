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
// Note: full card/account numbers must never reach this server - actual
// charges go through Stripe (tokenized client-side via Stripe Elements in
// Payment.tsx). This endpoint only stores non-sensitive display metadata
// (last 4 digits), so the client is expected to send `last4`, not a full
// card/account number.
router.post('/methods', protect, asyncHandler(async (req, res) => {
  const { type, details } = req.body;

  if (!type || !details) {
    return res.status(400).json({ success: false, message: 'Type and details are required' });
  }

  const user = await User.findById(req.user._id);

  if (!user.paymentMethods) {
    user.paymentMethods = [];
  }

  const sanitizedDetails = {
    mobileNumber: details.mobileNumber,
    accountTitle: details.accountTitle,
    cardName: details.cardName,
    expiryMonth: details.expiryMonth,
    expiryYear: details.expiryYear,
    cardBrand: details.cardBrand,
    bankName: details.bankName,
    branchCode: details.branchCode
  };

  if (type === 'card') {
    if (!/^\d{4}$/.test(details.last4 || '')) {
      return res.status(400).json({ success: false, message: 'Card last 4 digits are required' });
    }
    sanitizedDetails.cardNumber = `****${details.last4}`;
  } else if (type === 'bank') {
    if (!/^\d{4}$/.test(details.last4 || '')) {
      return res.status(400).json({ success: false, message: 'Account last 4 digits are required' });
    }
    sanitizedDetails.accountNumber = `****${details.last4}`;
  }

  const newMethod = {
    _id: require('mongoose').Types.ObjectId(),
    type,
    details: sanitizedDetails,
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
  const { bookingId, currency = 'pkr' } = req.body;

  if (!bookingId) {
    return res.status(400).json({ success: false, message: 'Booking ID is required' });
  }

  const booking = await Booking.findById(bookingId).populate('listing', 'title owner');
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  // Only the renter on this booking may pay for it
  if (booking.renter.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to pay for this booking' });
  }

  // The amount to charge always comes from the booking's own stored pricing,
  // never from the client, so it can't be tampered with.
  const amount = booking.pricing?.totalAmount;
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Booking has no valid amount to charge' });
  }

  const chargeCurrency = (booking.pricing?.currency || currency).toLowerCase();

  // Get the owner from the booking or from the listing
  const listingOwner = booking.owner || booking.listing?.owner;

  // Create Stripe Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe expects amount in smallest currency unit (paisa for PKR)
    currency: chargeCurrency,
    metadata: {
      bookingId,
      userId: req.user._id.toString(),
      userEmail: req.user.email
    },
    description: `Booking for ${booking.listing?.title}`
  });

  // Create payment record in database
  const payment = await Payment.create({
    booking: bookingId,
    payer: req.user._id,
    payee: listingOwner || null,
    listing: booking.listing?._id || null,
    method: 'stripe',
    status: 'pending',
    amount: {
      subtotal: booking.pricing?.subtotal ?? amount,
      serviceFee: booking.pricing?.serviceFee ?? 0,
      commission: booking.pricing?.commission ?? 0,
      total: amount,
      currency: chargeCurrency.toUpperCase()
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
    
    // Set payout info for owner earnings. The owner is owed the subtotal
    // minus the platform's tiered commission — amount.total also includes
    // the borrower's service fee, which the owner never sees. See
    // Payment.ownerEarnings.
    payment.payout = {
      amount: payment.ownerEarnings,
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

  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });

  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  const isPayer = payment.payer?.toString() === req.user._id.toString();
  const isPayee = payment.payee?.toString() === req.user._id.toString();
  if (!isPayer && !isPayee && !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: 'Not authorized to view this payment' });
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

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

  const isPayer = payment.payer?._id?.toString() === req.user._id.toString();
  const isPayee = payment.payee?._id?.toString() === req.user._id.toString();
  if (!isPayer && !isPayee && !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: 'Not authorized to view this payment' });
  }

  res.json({ success: true, data: payment });
}));

// Note: the Stripe webhook handler lives in server.js, registered before the
// global express.json() middleware — Stripe signature verification requires
// the raw request body, which wouldn't be available if the route were mounted
// here (json() would already have parsed and consumed it by the time a request
// reaches this router).

module.exports = router;
