const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const asyncHandler = require('../middleware/asyncHandler');

// All routes require admin role
router.use(protect, authorize('admin'));

// @route   GET /api/v1/admin/dashboard
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [totalUsers, totalListings, totalBookings, activeListings] = await Promise.all([
    User.countDocuments(),
    Listing.countDocuments(),
    Booking.countDocuments(),
    Listing.countDocuments({ status: 'active' })
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalListings,
      totalBookings,
      activeListings
    }
  });
}));

// @route   GET /api/v1/admin/users
router.get('/users', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  res.json({ success: true, data: users, pagination: { page: Number(page), limit: Number(limit), total } });
}));

// @route   PUT /api/v1/admin/users/:id/status
router.put('/users/:id/status', asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({ success: true, data: user });
}));

// @route   GET /api/v1/admin/listings
router.get('/listings', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = {};
  if (status) query.status = status;

  const listings = await Listing.find(query)
    .populate('owner', 'name email')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await Listing.countDocuments(query);

  res.json({ success: true, data: listings, pagination: { page: Number(page), limit: Number(limit), total } });
}));

// @route   PUT /api/v1/admin/listings/:id/status
router.put('/listings/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const listing = await Listing.findByIdAndUpdate(req.params.id, { status }, { new: true });

  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  res.json({ success: true, data: listing });
}));

module.exports = router;
