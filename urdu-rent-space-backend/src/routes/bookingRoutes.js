const express = require('express');
const router = express.Router();
const { protect, borrowerOnly, ownerOnly } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const asyncHandler = require('../middleware/asyncHandler');

// @route   GET /api/v1/bookings
router.get('/', protect, asyncHandler(async (req, res) => {
  const { status, type } = req.query;
  const query = {};

  // Filter based on user role and type parameter
  if (type === 'renter') {
    // Only borrowers/both can see their rentals
    query.renter = req.user._id;
  } else if (type === 'owner') {
    // Only owners/both can see bookings for their listings
    query.owner = req.user._id;
  } else {
    // Show all bookings related to user based on their role
    if (req.user.role === 'borrower') {
      query.renter = req.user._id;
    } else if (req.user.role === 'owner') {
      query.owner = req.user._id;
    } else {
      // 'both' role can see all their bookings
      query.$or = [{ renter: req.user._id }, { owner: req.user._id }];
    }
  }

  if (status) query.status = status;

  const bookings = await Booking.find(query)
    .populate('listing', 'title images pricing')
    .populate('renter', 'fullName profileImage phone')
    .populate('owner', 'fullName profileImage phone')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: bookings });
}));

// @route   GET /api/v1/bookings/:id
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('listing')
    .populate('renter', 'fullName profileImage phone email')
    .populate('owner', 'fullName profileImage phone email');

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
// Only borrowers can create bookings (rent items)
router.post('/', protect, borrowerOnly, asyncHandler(async (req, res) => {
  const { listingId, startDate, endDate, message } = req.body;

  const listing = await Listing.findById(listingId);
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  if (listing.owner.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Cannot book your own listing' });
  }

  // Calculate duration and pricing
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;

  // Check for blocked dates
  if (listing.availability?.blockedDates && listing.availability.blockedDates.length > 0) {
    const blockedDates = listing.availability.blockedDates.map(d => new Date(d).toDateString());
    
    // Generate all dates in the booking range
    const bookingDates = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      bookingDates.push(new Date(currentDate).toDateString());
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Check if any booking date is blocked
    const conflictingDates = bookingDates.filter(date => blockedDates.includes(date));
    if (conflictingDates.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Some of the selected dates are not available for booking',
        blockedDates: conflictingDates
      });
    }
  }

  // Check for existing approved/pending bookings that conflict
  const existingBookings = await Booking.find({
    listing: listingId,
    status: { $in: ['approved', 'pending', 'in_progress'] },
    $or: [
      { startDate: { $lte: end }, endDate: { $gte: start } }
    ]
  });

  if (existingBookings.length > 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'This listing is already booked for some of the selected dates'
    });
  }
  
  // Get the best available daily rate
  let dailyRate = listing.pricing?.daily || 0;
  let priceType = 'daily';
  
  // If no daily rate, calculate from weekly or monthly
  if (dailyRate === 0 && listing.pricing?.weekly) {
    dailyRate = Math.round(listing.pricing.weekly / 7);
    priceType = 'weekly';
  } else if (dailyRate === 0 && listing.pricing?.monthly) {
    dailyRate = Math.round(listing.pricing.monthly / 30);
    priceType = 'monthly';
  } else if (dailyRate === 0 && listing.pricing?.hourly) {
    dailyRate = listing.pricing.hourly * 24;
    priceType = 'hourly';
  }
  
  const subtotal = dailyRate * days;
  const serviceFee = Math.round(subtotal * 0.05); // 5% service fee
  const totalAmount = subtotal + serviceFee;

  const booking = await Booking.create({
    listing: listingId,
    renter: req.user._id,
    owner: listing.owner,
    startDate: start,
    endDate: end,
    duration: {
      value: days,
      unit: 'days'
    },
    pricing: {
      priceType,
      unitPrice: dailyRate,
      subtotal,
      serviceFee,
      deposit: listing.policies?.deposit?.amount || 0,
      totalAmount,
      currency: listing.pricing?.currency || 'PKR'
    },
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

  // Only owner can approve/reject
  if (['approved', 'rejected'].includes(status)) {
    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the listing owner can approve/reject bookings' });
    }
    // Verify user has owner role
    if (!['owner', 'both'].includes(req.user.role) && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Only owners can approve/reject bookings' });
    }
  }

  // Only renter can cancel
  if (status === 'cancelled' && booking.renter.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the renter can cancel this booking' });
  }

  booking.status = status;
  await booking.save();

  res.json({ success: true, data: booking });
}));

module.exports = router;
