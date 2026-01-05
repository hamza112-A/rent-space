const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const asyncHandler = require('../middleware/asyncHandler');

// @route   GET /api/v1/bookings
router.get('/', protect, asyncHandler(async (req, res) => {
  const { status, type } = req.query;
  const query = {};

  if (type === 'renter') {
    query.renter = req.user._id;
  } else if (type === 'owner') {
    query.owner = req.user._id;
  } else {
    query.$or = [{ renter: req.user._id }, { owner: req.user._id }];
  }

  if (status) query.status = status;

  const bookings = await Booking.find(query)
    .populate('listing', 'title images pricing')
    .populate('renter', 'name avatar')
    .populate('owner', 'name avatar')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: bookings });
}));

// @route   GET /api/v1/bookings/:id
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('listing')
    .populate('renter', 'name avatar phone email')
    .populate('owner', 'name avatar phone email');

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  if (booking.renter._id.toString() !== req.user._id.toString() && 
      booking.owner._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  res.json({ success: true, data: booking });
}));

// @route   POST /api/v1/bookings
router.post('/', protect, asyncHandler(async (req, res) => {
  const { listingId, startDate, endDate, message } = req.body;

  const listing = await Listing.findById(listingId);
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  if (listing.owner.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Cannot book your own listing' });
  }

  // Calculate total price
  const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
  const totalPrice = listing.pricing.basePrice * days;

  const booking = await Booking.create({
    listing: listingId,
    renter: req.user._id,
    owner: listing.owner,
    startDate,
    endDate,
    totalPrice,
    message,
    status: 'pending'
  });

  res.status(201).json({ success: true, data: booking });
}));

// @route   PUT /api/v1/bookings/:id/status
router.put('/:id/status', protect, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  // Only owner can approve/reject, only renter can cancel
  if (['approved', 'rejected'].includes(status) && booking.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only owner can approve/reject' });
  }

  if (status === 'cancelled' && booking.renter.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only renter can cancel' });
  }

  booking.status = status;
  await booking.save();

  res.json({ success: true, data: booking });
}));

module.exports = router;
