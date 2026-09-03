const express = require('express');
const router = express.Router();
const { protect, superAdminOnly, adminOnly, requireAdminRole } = require('../middleware/auth');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Dispute = require('../models/Dispute');
const asyncHandler = require('../middleware/asyncHandler');
const { escapeRegex } = require('../utils/validation');
const { logAdminAction } = require('../utils/adminAudit');

// Baseline: every route below requires at least SOME admin role.
// requireAdminRole(...) per-route/group narrows that further to specific
// roles. See docs/redesign/11-admin-panel.md.
router.use(protect, adminOnly);

// ==================== DASHBOARD ====================
router.get('/dashboard', requireAdminRole('support', 'finance'), asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, newUsersThisMonth, totalListings, activeListings, totalBookings, pendingBookings, completedBookings, totalRevenue, pendingVerifications] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Listing.countDocuments(),
    Listing.countDocuments({ status: 'active' }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ status: 'completed' }),
    // Platform revenue = borrower service fee + owner-side commission, not
    // amount.total (which is GMV — it also includes the subtotal that gets
    // paid out to the owner). See docs/redesign/01-business-model.md.
    Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: { $add: ['$amount.serviceFee', { $ifNull: ['$amount.commission', 0] }] } } } }]),
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
router.get('/users', requireAdminRole('support'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status, role } = req.query;
  const query = {};
  if (search) {
    const safeSearch = escapeRegex(search);
    query.$or = [{ fullName: new RegExp(safeSearch, 'i') }, { email: new RegExp(safeSearch, 'i') }, { phone: new RegExp(safeSearch, 'i') }];
  }
  if (status) query.status = status;
  if (role) query.role = role;

  const users = await User.find(query).select('-password -refreshTokens').skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  const total = await User.countDocuments(query);
  res.json({ success: true, data: users, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
}));

router.get('/users/:id', requireAdminRole('support'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshTokens');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const [listingsCount, bookingsCount] = await Promise.all([Listing.countDocuments({ owner: user._id }), Booking.countDocuments({ $or: [{ renter: user._id }, { owner: user._id }] })]);
  res.json({ success: true, data: { ...user.toObject(), listingsCount, bookingsCount } });
}));

router.put('/users/:id/status', requireAdminRole('support'), asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  if (!['active', 'suspended', 'banned'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
  const updateData = { status };
  if (status === 'suspended') { updateData.suspensionReason = reason; updateData.suspensionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); }
  const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password -refreshTokens');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  logAdminAction(req, { action: `User status set to ${status}`, targetType: 'user', targetId: user._id, details: { status, reason } });
  res.json({ success: true, data: user, message: `User ${status} successfully` });
}));


router.put('/users/:id/verify', requireAdminRole('support'), asyncHandler(async (req, res) => {
  const { type } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (type === 'email') { user.verification.email.verified = true; user.verification.email.verifiedAt = new Date(); }
  else if (type === 'phone') { user.verification.phone.verified = true; user.verification.phone.verifiedAt = new Date(); }
  else if (type === 'identity') { user.verification.identity.verified = true; user.verification.identity.status = 'approved'; user.verification.identity.verifiedAt = new Date(); }
  else if (type === 'biometric') { user.verification.biometric.verified = true; user.verification.biometric.status = 'approved'; user.verification.biometric.verifiedAt = new Date(); }

  await user.save();
  logAdminAction(req, { action: `${type} manually verified`, targetType: 'user', targetId: user._id, details: { type } });
  res.json({ success: true, data: user, message: `${type} verified successfully` });
}));

// Legacy boolean admin toggle — kept for any old callers, but new code
// should use /users/:id/admin-role below for granular roles.
router.put('/users/:id/role', requireAdminRole(), asyncHandler(async (req, res) => {
  const { isAdmin } = req.body;
  if (req.params.id === req.user.id && !isAdmin) return res.status(400).json({ success: false, message: 'Cannot remove your own admin status' });
  const user = await User.findByIdAndUpdate(req.params.id, { isAdmin }, { new: true }).select('-password -refreshTokens');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  logAdminAction(req, { action: `isAdmin set to ${isAdmin}`, targetType: 'user', targetId: user._id, details: { isAdmin } });
  res.json({ success: true, data: user });
}));

// Set a user's granular admin role — superadmin only, since this is the
// permission-granting action itself. See docs/redesign/11-admin-panel.md.
router.put('/users/:id/admin-role', requireAdminRole(), asyncHandler(async (req, res) => {
  const { adminRole } = req.body;
  if (!['none', 'support', 'finance', 'superadmin'].includes(adminRole)) {
    return res.status(400).json({ success: false, message: 'Invalid admin role' });
  }
  if (req.params.id === req.user.id && adminRole !== 'superadmin') {
    return res.status(400).json({ success: false, message: 'Cannot downgrade your own admin role' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const previousRole = user.adminRole;
  user.adminRole = adminRole;
  await user.save({ validateBeforeSave: false });

  logAdminAction(req, {
    action: `Admin role changed: ${previousRole} → ${adminRole}`,
    targetType: 'user',
    targetId: user._id,
    details: { previousRole, newRole: adminRole }
  });

  res.json({ success: true, data: { _id: user._id, fullName: user.fullName, adminRole: user.adminRole } });
}));

router.delete('/users/:id', requireAdminRole(), asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const listingIds = (await Listing.find({ owner: user._id }).select('_id')).map(l => l._id);
  const bookingIds = (await Booking.find({ $or: [{ renter: user._id }, { owner: user._id }, { listing: { $in: listingIds } }] }).select('_id')).map(b => b._id);
  const conversationIds = (await Conversation.find({ $or: [{ participants: user._id }, { listing: { $in: listingIds } }] }).select('_id')).map(c => c._id);

  // Delete records that reference the user, their listings, their bookings, or their conversations
  await Promise.all([
    Message.deleteMany({ $or: [{ sender: user._id }, { conversation: { $in: conversationIds } }] }),
    Review.deleteMany({ $or: [{ reviewerId: user._id }, { revieweeId: user._id }, { listingId: { $in: listingIds } }, { bookingId: { $in: bookingIds } }] }),
    Dispute.deleteMany({ $or: [{ complainant: user._id }, { respondent: user._id }, { booking: { $in: bookingIds } }, { listing: { $in: listingIds } }] }),
    Payment.deleteMany({ $or: [{ payer: user._id }, { payee: user._id }, { booking: { $in: bookingIds } }, { listing: { $in: listingIds } }] })
  ]);

  await Conversation.deleteMany({ _id: { $in: conversationIds } });
  await Booking.deleteMany({ _id: { $in: bookingIds } });
  await Listing.deleteMany({ owner: user._id });
  await User.findByIdAndDelete(req.params.id);

  logAdminAction(req, { action: 'User deleted', targetType: 'user', targetId: user._id, details: { email: user.email } });

  res.json({ success: true, message: 'User and associated data deleted successfully' });
}));

// ==================== LISTING MANAGEMENT ====================
router.get('/listings', requireAdminRole('support'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, category, search } = req.query;
  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (search) {
    const safeSearch = escapeRegex(search);
    query.$or = [{ title: new RegExp(safeSearch, 'i') }, { titleUrdu: new RegExp(safeSearch, 'i') }];
  }

  const listings = await Listing.find(query).populate('owner', 'fullName email phone').skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  const total = await Listing.countDocuments(query);
  res.json({ success: true, data: listings, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
}));

router.put('/listings/:id/status', requireAdminRole('support'), asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  if (!['active', 'paused', 'rejected', 'deleted'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
  const listing = await Listing.findByIdAndUpdate(req.params.id, { status, rejectionReason: reason }, { new: true }).populate('owner', 'fullName email');
  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
  logAdminAction(req, { action: `Listing status set to ${status}`, targetType: 'listing', targetId: listing._id, details: { status, reason } });
  res.json({ success: true, data: listing });
}));

router.put('/listings/:id/verify', requireAdminRole('support'), asyncHandler(async (req, res) => {
  const { verified } = req.body;
  const listing = await Listing.findByIdAndUpdate(req.params.id, { verified }, { new: true });
  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
  logAdminAction(req, { action: verified ? 'Listing verified' : 'Listing verification removed', targetType: 'listing', targetId: listing._id });
  res.json({ success: true, data: listing, message: verified ? 'Listing verified' : 'Verification removed' });
}));

router.put('/listings/:id/feature', requireAdminRole('support'), asyncHandler(async (req, res) => {
  const { featured } = req.body;
  const listing = await Listing.findByIdAndUpdate(req.params.id, { featured }, { new: true });
  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
  logAdminAction(req, { action: featured ? 'Listing featured' : 'Listing feature removed', targetType: 'listing', targetId: listing._id });
  res.json({ success: true, data: listing, message: featured ? 'Listing featured' : 'Feature removed' });
}));

router.delete('/listings/:id', requireAdminRole(), asyncHandler(async (req, res) => {
  const listing = await Listing.findByIdAndDelete(req.params.id);
  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
  logAdminAction(req, { action: 'Listing deleted', targetType: 'listing', targetId: listing._id, details: { title: listing.title } });
  res.json({ success: true, message: 'Listing deleted successfully' });
}));


// ==================== VERIFICATION MANAGEMENT ====================
router.get('/verifications', requireAdminRole('support'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, status } = req.query;
  let query = {};
  if (type === 'identity') query['verification.identity.status'] = status || 'pending';
  else if (type === 'biometric') query['verification.biometric.status'] = status || 'pending';
  else query.$or = [{ 'verification.identity.status': 'pending' }, { 'verification.biometric.status': 'pending' }];

  const users = await User.find(query).select('fullName email phone verification createdAt').skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  const total = await User.countDocuments(query);
  res.json({ success: true, data: users, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
}));

router.put('/verifications/:userId/approve', requireAdminRole('support'), asyncHandler(async (req, res) => {
  const { type } = req.body;
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (type === 'identity') { user.verification.identity.verified = true; user.verification.identity.status = 'approved'; user.verification.identity.verifiedAt = new Date(); }
  else if (type === 'biometric') { user.verification.biometric.verified = true; user.verification.biometric.status = 'approved'; user.verification.biometric.verifiedAt = new Date(); }

  await user.save();
  logAdminAction(req, { action: `${type} verification approved`, targetType: 'verification', targetId: user._id, details: { type } });
  res.json({ success: true, data: user, message: `${type} verification approved` });
}));

router.put('/verifications/:userId/reject', requireAdminRole('support'), asyncHandler(async (req, res) => {
  const { type, reason } = req.body;
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (type === 'identity') { user.verification.identity.verified = false; user.verification.identity.status = 'rejected'; user.verification.identity.rejectionReason = reason; }
  else if (type === 'biometric') { user.verification.biometric.verified = false; user.verification.biometric.status = 'rejected'; user.verification.biometric.rejectionReason = reason; }

  await user.save();
  logAdminAction(req, { action: `${type} verification rejected`, targetType: 'verification', targetId: user._id, details: { type, reason } });
  res.json({ success: true, data: user, message: `${type} verification rejected` });
}));

// ==================== BOOKING MANAGEMENT ====================
router.get('/bookings', requireAdminRole('support'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = {};
  if (status) query.status = status;

  const bookings = await Booking.find(query).populate('listing', 'title').populate('renter', 'fullName email').populate('owner', 'fullName email').skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  const total = await Booking.countDocuments(query);
  res.json({ success: true, data: bookings, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
}));

// ==================== PAYOUT OVERSIGHT ====================
// See docs/redesign/11-admin-panel.md — admin visibility into
// pending/processing/failed payouts now that a real Payout model exists.
const Payout = require('../models/Payout');

router.get('/payouts', requireAdminRole('finance'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = {};
  if (status) query.status = status;

  const payouts = await Payout.find(query)
    .populate('user', 'fullName email')
    .populate('processedBy', 'fullName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await Payout.countDocuments(query);
  const totals = await Payout.aggregate([
    { $group: { _id: '$status', amount: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    data: payouts,
    totals,
    pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) }
  });
}));

// Mark a manual-rail payout (bank_transfer/jazzcash/easypaisa) as paid once
// the admin has actually sent the money outside the platform, or as failed
// if it couldn't be completed — these rails have no gateway integration to
// do this automatically (see docs/redesign/08-earnings.md).
router.put('/payouts/:id/mark-paid', requireAdminRole('finance'), asyncHandler(async (req, res) => {
  const payout = await Payout.findById(req.params.id);
  if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });
  if (payout.method === 'stripe') {
    return res.status(400).json({ success: false, message: 'Stripe payouts are processed automatically' });
  }

  payout.status = 'paid';
  payout.processedBy = req.user._id;
  payout.processedAt = new Date();
  await payout.save();

  await Payment.updateMany(
    { payee: payout.user, 'payout.payoutId': payout._id.toString() },
    { $set: { 'payout.status': 'completed', 'payout.processedAt': new Date() } }
  );

  logAdminAction(req, { action: 'Payout marked paid', targetType: 'payout', targetId: payout._id, details: { amount: payout.amount, method: payout.method } });
  res.json({ success: true, data: payout });
}));

router.put('/payouts/:id/mark-failed', requireAdminRole('finance'), asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const payout = await Payout.findById(req.params.id);
  if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });

  payout.status = 'failed';
  payout.failureReason = reason || 'Marked failed by admin';
  payout.processedBy = req.user._id;
  payout.processedAt = new Date();
  await payout.save();

  // Un-mark the underlying payments so they're available for a retry payout.
  await Payment.updateMany(
    { payee: payout.user, 'payout.payoutId': payout._id.toString() },
    { $set: { 'payout.status': 'pending' }, $unset: { 'payout.payoutId': '' } }
  );

  logAdminAction(req, { action: 'Payout marked failed', targetType: 'payout', targetId: payout._id, details: { amount: payout.amount, reason } });
  res.json({ success: true, data: payout });
}));

// ==================== REPORT / ABUSE QUEUE ====================
// Feeds from the block/report action in Messages — see
// docs/redesign/06-messages.md and 11-admin-panel.md.
router.get('/reports', requireAdminRole('support'), asyncHandler(async (req, res) => {
  const users = await User.find({ 'reports.0': { $exists: true } })
    .select('fullName email reports')
    .populate('reports.reportedBy', 'fullName email');

  const reports = [];
  users.forEach((u) => {
    u.reports.forEach((r) => {
      reports.push({
        _id: r._id,
        reportedUser: { _id: u._id, fullName: u.fullName, email: u.email },
        reportedBy: r.reportedBy,
        reason: r.reason,
        description: r.description,
        conversationId: r.conversationId,
        createdAt: r.createdAt,
        dismissed: r.dismissed || false
      });
    });
  });
  reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, data: reports });
}));

router.put('/reports/:userId/:reportId/dismiss', requireAdminRole('support'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const report = user.reports.id(req.params.reportId);
  if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

  report.dismissed = true;
  await user.save({ validateBeforeSave: false });

  logAdminAction(req, { action: 'Report dismissed', targetType: 'report', targetId: report._id, details: { reportedUser: user._id, reason: report.reason } });
  res.json({ success: true, message: 'Report dismissed' });
}));

// ==================== AUDIT LOG ====================
// See docs/redesign/11-admin-panel.md — who approved/rejected/changed what,
// and when. Superadmin only, since it's an accountability tool over other
// admins' actions.
router.get('/audit-log', requireAdminRole(), asyncHandler(async (req, res) => {
  const AdminAuditLog = require('../models/AdminAuditLog');
  const { page = 1, limit = 50, admin, targetType } = req.query;
  const query = {};
  if (admin) query.admin = admin;
  if (targetType) query.targetType = targetType;

  const entries = await AdminAuditLog.find(query)
    .populate('admin', 'fullName email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await AdminAuditLog.countDocuments(query);

  res.json({ success: true, data: entries, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
}));

// ==================== ANALYTICS ====================
router.get('/analytics/revenue', requireAdminRole('finance'), asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
  // Platform revenue, not GMV — see note on the /dashboard route above.
  const revenue = await Payment.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: startDate } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: { $add: ['$amount.serviceFee', { $ifNull: ['$amount.commission', 0] }] } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  const totalRevenue = revenue.reduce((sum, day) => sum + day.total, 0);
  res.json({ success: true, data: { daily: revenue, total: totalRevenue } });
}));

router.get('/analytics/users', requireAdminRole('support', 'finance'), asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
  const userGrowth = await User.aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  const roleDistribution = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
  res.json({ success: true, data: { growth: userGrowth, roles: roleDistribution } });
}));

router.get('/analytics/listings', requireAdminRole('support', 'finance'), asyncHandler(async (req, res) => {
  const categoryDistribution = await Listing.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
  const statusDistribution = await Listing.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  res.json({ success: true, data: { categories: categoryDistribution, statuses: statusDistribution } });
}));

// ==================== CATEGORY MANAGEMENT ====================
// Structural/site-wide, so kept superadmin-only rather than opened to
// 'support' — a bad category edit affects every listing on the platform.
router.get('/settings/categories', requireAdminRole('support', 'finance'), asyncHandler(async (req, res) => {
  const Category = require('../models/Category');
  const categories = await Category.find().sort({ order: 1 });
  res.json({ success: true, data: categories });
}));

router.post('/settings/categories', requireAdminRole(), asyncHandler(async (req, res) => {
  const Category = require('../models/Category');
  const category = await Category.create(req.body);
  logAdminAction(req, { action: 'Category created', targetType: 'category', targetId: category._id, details: { name: category.name } });
  res.status(201).json({ success: true, data: category });
}));

router.put('/settings/categories/:id', requireAdminRole(), asyncHandler(async (req, res) => {
  const Category = require('../models/Category');
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  logAdminAction(req, { action: 'Category updated', targetType: 'category', targetId: category._id, details: req.body });
  res.json({ success: true, data: category });
}));

router.delete('/settings/categories/:id', requireAdminRole(), asyncHandler(async (req, res) => {
  const Category = require('../models/Category');
  const category = await Category.findByIdAndDelete(req.params.id);
  logAdminAction(req, { action: 'Category deleted', targetType: 'category', targetId: req.params.id, details: { name: category?.name } });
  res.json({ success: true, message: 'Category deleted' });
}));

module.exports = router;
