const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Payment = require('../models/Payment');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

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

  // Create new payment method
  const newMethod = {
    _id: require('mongoose').Types.ObjectId(),
    type, // 'jazzcash', 'easypaisa', 'card', 'bank'
    details: {
      ...details,
      // Mask sensitive data
      cardNumber: details.cardNumber ? `****${details.cardNumber.slice(-4)}` : undefined,
      accountNumber: details.accountNumber ? `****${details.accountNumber.slice(-4)}` : undefined,
    },
    isDefault: user.paymentMethods.length === 0, // First method is default
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

  // If deleted method was default, make first remaining method default
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

  // Reset all to non-default
  user.paymentMethods.forEach(m => m.isDefault = false);

  // Set the specified one as default
  const method = user.paymentMethods.find(m => m._id.toString() === req.params.id);
  if (!method) {
    return res.status(404).json({ success: false, message: 'Payment method not found' });
  }

  method.isDefault = true;
  await user.save();

  res.json({ success: true, data: method });
}));

// @route   GET /api/v1/payments/:id
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('booking')
    .populate('listing', 'title images')
    .populate('payer', 'name email')
    .populate('payee', 'name email');

  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  res.json({ success: true, data: payment });
}));

// @route   POST /api/v1/payments/initiate
router.post('/initiate', protect, asyncHandler(async (req, res) => {
  const { bookingId, method } = req.body;

  // Create payment record
  const payment = await Payment.create({
    booking: bookingId,
    payer: req.user._id,
    method,
    status: 'pending',
    amount: req.body.amount
  });

  // Return payment details (in real app, integrate with payment gateway)
  res.status(201).json({
    success: true,
    data: payment,
    message: 'Payment initiated. Complete payment to confirm booking.'
  });
}));

// @route   POST /api/v1/payments/verify
router.post('/verify', protect, asyncHandler(async (req, res) => {
  const { paymentId, transactionId } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  // Verify with payment gateway (mock for now)
  payment.status = 'completed';
  payment.transactionId = transactionId;
  payment.paidAt = new Date();
  await payment.save();

  res.json({ success: true, data: payment });
}));

module.exports = router;
