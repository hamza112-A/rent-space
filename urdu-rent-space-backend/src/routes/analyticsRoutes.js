const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const asyncHandler = require('../middleware/asyncHandler');

// @route   GET /api/v1/analytics/overview
router.get('/overview', protect, asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [totalListings, activeListings, totalBookings, completedBookings] = await Promise.all([
    Listing.countDocuments({ owner: userId }),
    Listing.countDocuments({ owner: userId, status: 'active' }),
    Booking.countDocuments({ owner: userId }),
    Booking.countDocuments({ owner: userId, status: 'completed' })
  ]);

  // Calculate total views
  const listings = await Listing.find({ owner: userId }).select('views');
  const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);

  res.json({
    success: true,
    data: {
      totalListings,
      activeListings,
      totalBookings,
      completedBookings,
      totalViews
    }
  });
}));

// @route   GET /api/v1/analytics/earnings
router.get('/earnings', protect, asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  
  let startDate = new Date();
  if (period === '7d') startDate.setDate(startDate.getDate() - 7);
  else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
  else if (period === '90d') startDate.setDate(startDate.getDate() - 90);

  const bookings = await Booking.find({
    owner: req.user._id,
    status: 'completed',
    createdAt: { $gte: startDate }
  });

  const totalEarnings = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  res.json({
    success: true,
    data: {
      period,
      totalEarnings,
      bookingsCount: bookings.length
    }
  });
}));

// @route   GET /api/v1/analytics/listings/:id
router.get('/listings/:id', protect, asyncHandler(async (req, res) => {
  const listing = await Listing.findOne({ _id: req.params.id, owner: req.user._id });

  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  const bookings = await Booking.countDocuments({ listing: req.params.id });

  res.json({
    success: true,
    data: {
      views: listing.views || 0,
      bookings,
      rating: listing.averageRating || 0,
      reviewsCount: listing.reviewsCount || 0
    }
  });
}));

module.exports = router;
