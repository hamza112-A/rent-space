const express = require('express');
const router = express.Router();
const { protect, superAdminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const asyncHandler = require('../middleware/asyncHandler');

// All routes require super admin role
router.use(protect, superAdminOnly);

// ==================== DASHBOARD ====================
router.get('/dashboard', asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, newUsersThisMonth, totalListings, activeListings, totalBookings, pendingBookings, completedBookings, totalRevenue, pendingVerifications] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Listing.countDocuments(),
    Listing.countDocuments({ status: 'active' }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ status: 'completed' }),
    Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    User.countDocuments({ $or: [{ 'verification.identity.status': 'pending' }, { 'verification.biometric.status': 'pending' }] })
  ]);

  const recentUsers = await User.find().select('fullName email createdAt').sort({ createdAt: -1 }).limit(5);
  const recentBookings = await Booking.find().populate('listing', 'title').populate('renter', 'fullName').sort({ createdAt: -1 }).limit(5);

  res.json({
    success: true,
    data: {
      stats: { totalUsers, newUsersThisMonth, totalListings, activeListings, totalBookings, pendingBookings, completedBookings, totalRevenue: totalRevenue[0]?.total || 0, pendingVerifications },
      recentUsers,
      recentBookings
    }
  });
}));

// ==================== USER MANAGEMENT ====================
router.get('/users', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status, role } = req.query;
  const query = {};
  if (search) query.$or = [{ fullName: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }];
  if (status) query.status = status;
  if (role) query.role = role;

  const users = await User.find(query).select('-password -refreshTokens').skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  const total = await User.countDocuments(query);
  res.json({ success: true, data: users, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
}));

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshTokens');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const [listingsCount, bookingsCount] = await Promise.all([Listing.countDocuments({ owner: user._id }), Booking.countDocuments({ $or: [{ renter: user._id }, { owner: user._id }] })]);
  res.json({ success: true, data: { ...user.toObject(), listingsCount, bookingsCount } });
}));

router.put('/users/:id/status', asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  if (!['active', 'suspended', 'banned'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
  const updateData = { status };
  if (status === 'suspended') { updateData.suspensionReason = reason; updateData.suspensionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); }
  const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password -refreshTokens');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user, message: `User ${status} successfully` });
}));


router.put('/users/:id/verify', asyncHandler(async (req, res) => {
  const { type } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  
  if (type === 'email') { user.verification.email.verified = true; user.verification.email.verifiedAt = new Date(); }
  else if (type === 'phone') { user.verification.phone.verified = true; user.verification.phone.verifiedAt = new Date(); }
  else if (type === 'identity') { user.verification.identity.verified = true; user.verification.identity.status = 'approved'; user.verification.identity.verifiedAt = new Date(); }
  else if (type === 'biometric') { user.verification.biometric.verified = true; user.verification.biometric.status = 'approved'; user.verification.biometric.verifiedAt = new Date(); }
  
  await user.save();
  res.json({ success: true, data: user, message: `${type} verified successfully` });
}));

router.put('/users/:id/role', asyncHandler(async (req, res) => {
  const { isAdmin } = req.body;
  if (req.params.id === req.user.id && !isAdmin) return res.status(400).json({ success: false, message: 'Cannot remove your own admin status' });
  const user = await User.findByIdAndUpdate(req.params.id, { isAdmin }, { new: true }).select('-password -refreshTokens');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
}));

router.delete('/users/:id', asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  await Listing.deleteMany({ owner: user._id });
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User and associated data deleted successfully' });
}));

// ==================== LISTING MANAGEMENT ====================
router.get('/listings', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, category } = req.query;
  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;

  const listings = await Listing.find(query).populate('owner', 'fullName email phone').skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  const total = await Listing.countDocuments(query);
  res.json({ success: true, data: listings, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
}));

router.put('/listings/:id/status', asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  if (!['active', 'paused', 'rejected', 'deleted'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
  const listing = await Listing.findByIdAndUpdate(req.params.id, { status, rejectionReason: reason }, { new: true }).populate('owner', 'fullName email');
  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
  res.json({ success: true, data: listing });
}));

router.put('/listings/:id/verify', asyncHandler(async (req, res) => {
  const { verified } = req.body;
  const listing = await Listing.findByIdAndUpdate(req.params.id, { verified }, { new: true });
  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
  res.json({ success: true, data: listing, message: verified ? 'Listing verified' : 'Verification removed' });
}));

router.put('/listings/:id/feature', asyncHandler(async (req, res) => {
  const { featured } = req.body;
  const listing = await Listing.findByIdAndUpdate(req.params.id, { featured }, { new: true });
  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
  res.json({ success: true, data: listing, message: featured ? 'Listing featured' : 'Feature removed' });
}));

router.delete('/listings/:id', asyncHandler(async (req, res) => {
  const listing = await Listing.findByIdAndDelete(req.params.id);
  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
  res.json({ success: true, message: 'Listing deleted successfully' });
}));


// ==================== VERIFICATION MANAGEMENT ====================
router.get('/verifications', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, status } = req.query;
  let query = {};
  if (type === 'identity') query['verification.identity.status'] = status || 'pending';
  else if (type === 'biometric') query['verification.biometric.status'] = status || 'pending';
  else query.$or = [{ 'verification.identity.status': 'pending' }, { 'verification.biometric.status': 'pending' }];

  const users = await User.find(query).select('fullName email phone verification createdAt').skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  const total = await User.countDocuments(query);
  res.json({ success: true, data: users, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
}));

router.put('/verifications/:userId/approve', asyncHandler(async (req, res) => {
  const { type } = req.body;
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  
  if (type === 'identity') { user.verification.identity.verified = true; user.verification.identity.status = 'approved'; user.verification.identity.verifiedAt = new Date(); }
  else if (type === 'biometric') { user.verification.biometric.verified = true; user.verification.biometric.status = 'approved'; user.verification.biometric.verifiedAt = new Date(); }
  
  await user.save();
  res.json({ success: true, data: user, message: `${type} verification approved` });
}));

router.put('/verifications/:userId/reject', asyncHandler(async (req, res) => {
  const { type, reason } = req.body;
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  
  if (type === 'identity') { user.verification.identity.verified = false; user.verification.identity.status = 'rejected'; user.verification.identity.rejectionReason = reason; }
  else if (type === 'biometric') { user.verification.biometric.verified = false; user.verification.biometric.status = 'rejected'; user.verification.biometric.rejectionReason = reason; }
  
  await user.save();
  res.json({ success: true, data: user, message: `${type} verification rejected` });
}));

// ==================== BOOKING MANAGEMENT ====================
router.get('/bookings', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = {};
  if (status) query.status = status;

  const bookings = await Booking.find(query).populate('listing', 'title').populate('renter', 'fullName email').populate('owner', 'fullName email').skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  const total = await Booking.countDocuments(query);
  res.json({ success: true, data: bookings, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
}));

// ==================== ANALYTICS ====================
router.get('/analytics/revenue', asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
  const revenue = await Payment.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: startDate } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  const totalRevenue = revenue.reduce((sum, day) => sum + day.total, 0);
  res.json({ success: true, data: { daily: revenue, total: totalRevenue } });
}));

router.get('/analytics/users', asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
  const userGrowth = await User.aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  const roleDistribution = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
  res.json({ success: true, data: { growth: userGrowth, roles: roleDistribution } });
}));

router.get('/analytics/listings', asyncHandler(async (req, res) => {
  const categoryDistribution = await Listing.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
  const statusDistribution = await Listing.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  res.json({ success: true, data: { categories: categoryDistribution, statuses: statusDistribution } });
}));

// ==================== CATEGORY MANAGEMENT ====================
router.get('/settings/categories', asyncHandler(async (req, res) => {
  const Category = require('../models/Category');
  const categories = await Category.find().sort({ order: 1 });
  res.json({ success: true, data: categories });
}));

router.post('/settings/categories', asyncHandler(async (req, res) => {
  const Category = require('../models/Category');
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, data: category });
}));

router.put('/settings/categories/:id', asyncHandler(async (req, res) => {
  const Category = require('../models/Category');
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, data: category });
}));

router.delete('/settings/categories/:id', asyncHandler(async (req, res) => {
  const Category = require('../models/Category');
  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Category deleted' });
}));

module.exports = router;
