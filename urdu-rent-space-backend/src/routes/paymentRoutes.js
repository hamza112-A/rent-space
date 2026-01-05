const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Payment = require('../models/Payment');
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
