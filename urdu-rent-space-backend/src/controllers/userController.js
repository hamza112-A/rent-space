const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/uploadService');
const { sendEmail } = require('../services/emailService');
const { validateInput } = require('../utils/validation');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get user profile
// @route   GET /api/v1/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PATCH /api/v1/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res, next) => {
  const { fullName, bio, phone, location, preferences, activeMode, completeRoleOnboarding } = req.body;

  // Which dashboard ('owner'/'borrower') a 'both' user wants to see by
  // default — a single-role user can't switch away from their only role.
  if (activeMode !== undefined) {
    if (!['owner', 'borrower'].includes(activeMode)) {
      return next(new ErrorResponse('Invalid active mode', 400));
    }

    const currentUser = await User.findById(req.user.id).select('role');
    const allowedModes = currentUser.role === 'both' ? ['owner', 'borrower'] : [currentUser.role];

    if (!allowedModes.includes(activeMode)) {
      return next(new ErrorResponse('You do not have that role on your account', 403));
    }
  }

  // Marks the one-time role-onboarding modal as seen for that role, so it
  // doesn't reappear on the next login.
  if (completeRoleOnboarding !== undefined && !['owner', 'borrower'].includes(completeRoleOnboarding)) {
    return next(new ErrorResponse('Invalid role', 400));
  }

  // Validate input
  const validation = validateInput({
    fullName: { value: fullName, rules: ['string', 'max:100'] },
    bio: { value: bio, rules: ['string', 'max:500'] },
    phone: { value: phone, rules: ['phone'] }
  });

  if (!validation.isValid) {
    return next(new ErrorResponse('Validation failed', 400, validation.errors));
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Handle avatar upload if provided
  let avatarData = user.avatar;
  if (req.file) {
    try {
      // Delete old avatar if exists
      if (user.avatar && user.avatar.public_id) {
        try {
          await deleteFromCloudinary(user.avatar.public_id);
        } catch (deleteError) {
          console.warn('Failed to delete old avatar:', deleteError.message);
        }
      }

      // Upload new avatar
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'avatars',
        width: 300,
        height: 300,
        crop: 'fill',
        resource_type: 'image'
      });

      avatarData = {
        public_id: result.public_id,
        url: result.secure_url
      };
    } catch (error) {
      console.error('Avatar upload error:', error);
      return next(new ErrorResponse(`Avatar upload failed: ${error.message}`, 500));
    }
  }

  // Update user fields
  const updateData = {
    ...(fullName && { fullName }),
    ...(bio && { bio }),
    ...(phone && { phone }),
    ...(location && { location }),
    ...(preferences && { preferences }),
    ...(activeMode !== undefined && { activeMode }),
    ...(completeRoleOnboarding === 'owner' && { 'ownerProfile.onboardingCompletedAt': new Date() }),
    ...(completeRoleOnboarding === 'borrower' && { 'buyerProfile.onboardingCompletedAt': new Date() }),
    ...(avatarData && { avatar: avatarData }),
    updatedAt: new Date()
  };

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: updatedUser
  });
});

// @desc    Get user statistics
// @route   GET /api/v1/users/stats
// @access  Private
const getUserStats = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Get additional stats from related collections
  const Listing = require('../models/Listing');
  const Booking = require('../models/Booking');

  const [listingStats, bookingStats] = await Promise.all([
    Listing.aggregate([
      { $match: { owner: user._id } },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          activeListings: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          totalViews: { $sum: '$stats.views' },
          totalFavorites: { $sum: '$stats.favorites' }
        }
      }
    ]),
    Booking.getStats(req.user.id, user.role === 'owner' ? 'owner' : 'renter')
  ]);

  const stats = {
    ...user.stats.toObject(),
    ...(listingStats[0] || {}),
    ...(bookingStats[0] || {})
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    Get aggregated dashboard overview (action items, this-month
//          summary, plan status, recent activity) for the current user's
//          role — one call instead of the client stitching together 4-5.
//          See docs/redesign/03-overview-tab.md.
// @route   GET /api/v1/users/dashboard-overview
// @access  Private
const getDashboardOverview = asyncHandler(async (req, res, next) => {
  const Listing = require('../models/Listing');
  const Booking = require('../models/Booking');
  const Conversation = require('../models/Conversation');
  const Dispute = require('../models/Dispute');
  const Payment = require('../models/Payment');
  const Payout = require('../models/Payout');
  const Review = require('../models/Review');
  const { getPlan, SUBSCRIPTION_PLANS } = require('../config/subscriptionPlans');

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const userId = user._id;
  const isOwner = user.role === 'owner' || user.role === 'both';
  const isBorrower = user.role === 'borrower' || user.role === 'both';

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const overview = {};

  if (isOwner) {
    const NET_EARNINGS_EXPR = { $subtract: ['$amount.subtotal', { $ifNull: ['$amount.commission', 0] }] };

    const [
      pendingBookings,
      openDisputes,
      expiringListings,
      conversations,
      activeListingsCount,
      monthBookingsCreated,
      monthBookingsCompleted,
      netEarningsAgg,
      totalViewsAgg,
      recentBookingsForActivity,
      recentPayouts,
      recentReviews
    ] = await Promise.all([
      Booking.countDocuments({ owner: userId, status: 'pending' }),
      Dispute.countDocuments({ complainant: userId, status: { $nin: ['resolved', 'closed'] } }),
      Listing.countDocuments({ owner: userId, status: 'active', expiresAt: { $gte: now, $lte: sevenDaysFromNow } }),
      Conversation.find({ participants: userId }),
      Listing.countDocuments({ owner: userId, status: 'active' }),
      Booking.countDocuments({ owner: userId, createdAt: { $gte: thisMonthStart } }),
      Booking.countDocuments({ owner: userId, status: 'completed', completedAt: { $gte: thisMonthStart } }),
      Payment.aggregate([
        { $match: { payee: userId, status: 'completed', createdAt: { $gte: thisMonthStart } } },
        { $group: { _id: null, net: { $sum: NET_EARNINGS_EXPR } } }
      ]),
      Listing.aggregate([
        { $match: { owner: userId } },
        { $group: { _id: null, totalViews: { $sum: '$stats.views' } } }
      ]),
      Booking.find({ owner: userId }).sort({ createdAt: -1 }).limit(5)
        .populate('listing', 'title').populate('renter', 'fullName'),
      Payout.find({ user: userId, status: 'paid' }).sort({ processedAt: -1 }).limit(5),
      Review.find({ revieweeId: userId }).sort({ createdAt: -1 }).limit(5)
        .populate('reviewerId', 'fullName')
    ]);

    const unreadMessages = conversations.reduce(
      (sum, c) => sum + (c.unreadCount?.get(userId.toString()) || 0),
      0
    );

    const plan = getPlan(user.subscription.plan);
    const monthlyEarnings = netEarningsAgg[0]?.net || 0;
    const totalViews = totalViewsAgg[0]?.totalViews || 0;
    // Approximate: view counts are cumulative (not bucketed by month), so this
    // reads as "this month's inquiries against all-time listing views," not a
    // strict monthly funnel. Good enough as a directional signal.
    const conversionRate = totalViews > 0
      ? Math.round((monthBookingsCreated / totalViews) * 1000) / 10
      : 0;

    const planOrder = ['free', 'plus', 'pro', 'business'];
    const currentPlanIndex = planOrder.indexOf(plan.id);
    let upgradeNudge = null;
    if (currentPlanIndex !== -1 && currentPlanIndex < planOrder.length - 1 && monthlyEarnings > 0) {
      const nextPlan = SUBSCRIPTION_PLANS[planOrder[currentPlanIndex + 1]];
      const grossSubtotal = monthlyEarnings / (1 - plan.commissionRate);
      const estimatedMonthlySavings = Math.round(
        grossSubtotal * plan.commissionRate - grossSubtotal * nextPlan.commissionRate
      );
      if (estimatedMonthlySavings > 0) {
        upgradeNudge = {
          nextPlan: nextPlan.id,
          nextPlanName: nextPlan.name,
          estimatedMonthlySavings
        };
      }
    }

    const activity = [];
    recentBookingsForActivity.forEach((b) => activity.push({
      type: 'booking',
      message: `${b.renter?.fullName || 'A renter'} ${b.status === 'completed' ? 'completed a rental of' : 'requested to book'} "${b.listing?.title || 'your listing'}"`,
      date: b.completedAt || b.createdAt
    }));
    recentPayouts.forEach((p) => activity.push({
      type: 'payout',
      message: `Payout of PKR ${p.amount.toLocaleString()} sent`,
      date: p.processedAt || p.requestedAt
    }));
    recentReviews.forEach((r) => activity.push({
      type: 'review',
      message: `${r.reviewerId?.fullName || 'Someone'} left a ${r.rating}-star review`,
      date: r.createdAt
    }));
    activity.sort((a, b) => new Date(b.date) - new Date(a.date));

    overview.owner = {
      actionNeeded: {
        pendingBookings,
        unreadMessages,
        openDisputes,
        expiringListings,
        verificationLevel: user.verificationLevel
      },
      thisMonth: {
        earnings: monthlyEarnings,
        bookingsCompleted: monthBookingsCompleted,
        newInquiries: monthBookingsCreated,
        conversionRate
      },
      plan: {
        id: plan.id,
        name: plan.name,
        listingsUsed: activeListingsCount,
        maxListings: plan.maxListings,
        atListingLimit: plan.maxListings !== -1 && activeListingsCount >= plan.maxListings,
        featuredCredits: user.subscription.featuredCredits,
        commissionRate: user.subscription.commissionRate,
        upgradeNudge
      },
      recentActivity: activity.slice(0, 10)
    };
  }

  if (isBorrower) {
    const [upcomingBookings, conversations, userWithFavorites] = await Promise.all([
      Booking.find({ renter: userId, status: 'approved', startDate: { $gte: now } })
        .sort({ startDate: 1 })
        .limit(5)
        .populate('listing', 'title images location'),
      Conversation.find({ participants: userId }),
      User.findById(userId).populate({
        path: 'favorites',
        select: 'title images pricing status'
      })
    ]);

    const activeConversationsNeedingReply = conversations.filter(
      (c) => (c.unreadCount?.get(userId.toString()) || 0) > 0
    ).length;

    overview.borrower = {
      upcomingBookings,
      activeConversationsNeedingReply,
      savedListings: (userWithFavorites?.favorites || []).slice(0, 6)
    };
  }

  res.status(200).json({
    success: true,
    data: overview
  });
});

// @desc    Get public user profile
// @route   GET /api/v1/users/:id
// @access  Public
const getPublicProfile = asyncHandler(async (req, res, next) => {
  const { role } = req.query;

  if (role !== undefined && !['owner', 'borrower'].includes(role)) {
    return next(new ErrorResponse('Invalid role', 400));
  }

  const user = await User.findById(req.params.id)
    .select('fullName avatar bio rating responseRate responseTime stats ownerProfile buyerProfile createdAt verification.email.verified verification.phone.verified verification.identity.verified');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Increment profile views if viewer is different user
  if (req.user && req.user.id !== req.params.id) {
    user.stats.profileViews += 1;
    await user.save({ validateBeforeSave: false });
  }

  const data = user.toObject();
  // ?role=owner|borrower scopes rating/stats to that profile instead of the
  // legacy combined fields — used by pages showing a user's standing in one
  // specific role (e.g. as the owner of the listing being viewed).
  if (role) {
    const profile = role === 'owner' ? data.ownerProfile : data.buyerProfile;
    data.rating = profile.rating;
    data.stats = { ...data.stats, ...profile.stats };
  }

  res.status(200).json({
    success: true,
    data
  });
});

// @desc    Get verification status
// @route   GET /api/v1/users/verification
// @access  Private
const getVerificationStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .select('verification');

  res.status(200).json({
    success: true,
    data: user.verification
  });
});

// @desc    Upload ID document
// @route   POST /api/v1/users/verification/id
// @access  Private
const uploadIDDocument = asyncHandler(async (req, res, next) => {
  const { documentType } = req.body;

  if (!documentType || !['cnic', 'passport', 'driving_license'].includes(documentType)) {
    return next(new ErrorResponse('Valid document type is required', 400));
  }

  if (!req.files || !req.files.frontImage) {
    return next(new ErrorResponse('Front image is required', 400));
  }

  const user = await User.findById(req.user.id);

  try {
    const documents = [];

    // Upload front image
    const frontResult = await uploadToCloudinary(req.files.frontImage[0].buffer, {
      folder: 'id-documents',
      resource_type: 'image'
    });

    documents.push({
      type: 'front',
      public_id: frontResult.public_id,
      url: frontResult.secure_url
    });

    // Upload back image if provided
    if (req.files.backImage) {
      const backResult = await uploadToCloudinary(req.files.backImage[0].buffer, {
        folder: 'id-documents',
        resource_type: 'image'
      });

      documents.push({
        type: 'back',
        public_id: backResult.public_id,
        url: backResult.secure_url
      });
    }

    // Update user verification
    user.verification.identity = {
      verified: false,
      status: 'pending',
      documentType,
      documents,
      verifiedAt: null,
      rejectionReason: null
    };

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        message: 'ID document uploaded successfully. Verification is pending.',
        status: 'pending'
      }
    });

  } catch (error) {
    return next(new ErrorResponse('Document upload failed', 500));
  }
});

// @desc    Upload biometric verification
// @route   POST /api/v1/users/verification/biometric
// @access  Private
const verifyBiometric = asyncHandler(async (req, res, next) => {
  if (!req.files || !req.files.selfieImage) {
    return next(new ErrorResponse('Selfie image is required', 400));
  }

  const user = await User.findById(req.user.id);

  try {
    // Upload selfie image
    const selfieResult = await uploadToCloudinary(req.files.selfieImage[0].buffer, {
      folder: 'biometric-verification',
      resource_type: 'image'
    });

    let livenessVideo = null;
    if (req.files.livenessVideo) {
      const videoResult = await uploadToCloudinary(req.files.livenessVideo[0].buffer, {
        folder: 'biometric-verification',
        resource_type: 'video'
      });

      livenessVideo = {
        public_id: videoResult.public_id,
        url: videoResult.secure_url
      };
    }

    // Update user verification
    user.verification.biometric = {
      verified: false,
      status: 'pending',
      selfieImage: {
        public_id: selfieResult.public_id,
        url: selfieResult.secure_url
      },
      livenessVideo,
      verifiedAt: null,
      rejectionReason: null
    };

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        message: 'Biometric data uploaded successfully. Verification is pending.',
        status: 'pending'
      }
    });

  } catch (error) {
    return next(new ErrorResponse('Biometric upload failed', 500));
  }
});

// @desc    Get user reviews
// @route   GET /api/v1/users/:id/reviews
// @access  Public
const getReviews = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, sortBy = 'recent', role } = req.query;

  if (role !== undefined && !['owner', 'borrower'].includes(role)) {
    return next(new ErrorResponse('Invalid role', 400));
  }

  const Review = require('../models/Review');

  let sortOptions = { createdAt: -1 };
  if (sortBy === 'highest') sortOptions = { rating: -1, createdAt: -1 };
  if (sortBy === 'lowest') sortOptions = { rating: 1, createdAt: -1 };

  // ?role=owner|borrower scopes to reviews received in that role only, so a
  // 'both' user's public profile can show owner reviews and buyer reviews
  // separately instead of one blended list.
  const query = { revieweeId: req.params.id, ...(role && { revieweeRole: role }) };

  const reviews = await Review.find(query)
    .populate('reviewerId', 'fullName avatar')
    .populate('listingId', 'title')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Review.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Add user review
// @route   POST /api/v1/users/:id/reviews
// @access  Private
const addReview = asyncHandler(async (req, res, next) => {
  const { rating, comment, bookingId } = req.body;

  // Validate input
  const validation = validateInput({
    rating: { value: rating, rules: ['required', 'number', 'min:1', 'max:5'] },
    comment: { value: comment, rules: ['required', 'string', 'max:1000'] },
    bookingId: { value: bookingId, rules: ['required', 'string'] }
  });

  if (!validation.isValid) {
    return next(new ErrorResponse('Validation failed', 400, validation.errors));
  }

  // Check if booking exists and is completed
  const Booking = require('../models/Booking');
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return next(new ErrorResponse('Booking not found', 404));
  }

  if (booking.status !== 'completed') {
    return next(new ErrorResponse('Can only review completed bookings', 400));
  }

  // Check if user was part of this booking
  if (booking.renter.toString() !== req.user.id && booking.owner.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to review this booking', 403));
  }

  // Check if review already exists
  const Review = require('../models/Review');
  const existingReview = await Review.findOne({
    bookingId,
    reviewerId: req.user.id,
    revieweeId: req.params.id
  });

  if (existingReview) {
    return next(new ErrorResponse('Review already exists for this booking', 400));
  }

  // Create review — revieweeRole records which hat the reviewee was
  // wearing in this booking, so ownerProfile/buyerProfile ratings (updated
  // by Review's post-save hook) stay independent.
  const revieweeRole = booking.owner.toString() === req.params.id ? 'owner' : 'borrower';
  const review = await Review.create({
    bookingId,
    reviewerId: req.user.id,
    revieweeId: req.params.id,
    revieweeRole,
    listingId: booking.listing,
    rating,
    comment
  });

  // Update user's rating
  const user = await User.findById(req.params.id);
  const totalReviews = await Review.countDocuments({ revieweeId: req.params.id });
  const avgRating = await Review.aggregate([
    { $match: { revieweeId: user._id } },
    { $group: { _id: null, avgRating: { $avg: '$rating' } } }
  ]);

  user.rating.average = avgRating[0]?.avgRating || 0;
  user.rating.count = totalReviews;
  await user.save({ validateBeforeSave: false });

  await review.populate('reviewerId', 'fullName avatar');

  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    Toggle blocking a user (marketplace safety control — see
//          docs/redesign/06-messages.md). A blocked user can't message you
//          or start a new conversation with you.
// @route   POST /api/v1/users/:id/block
// @access  Private
const toggleBlock = asyncHandler(async (req, res, next) => {
  if (req.params.id === req.user.id) {
    return next(new ErrorResponse('Cannot block yourself', 400));
  }

  const user = await User.findById(req.user.id);
  const idx = user.blockedUsers.findIndex((id) => id.toString() === req.params.id);
  let blocked;
  if (idx === -1) {
    user.blockedUsers.push(req.params.id);
    blocked = true;
  } else {
    user.blockedUsers.splice(idx, 1);
    blocked = false;
  }
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, data: { blocked } });
});

// @desc    Report a user (e.g. from a conversation) — feeds the admin
//          moderation queue. See docs/redesign/06-messages.md and
//          11-admin-panel.md.
// @route   POST /api/v1/users/:id/report
// @access  Private
const reportUser = asyncHandler(async (req, res, next) => {
  const { reason, description, conversationId } = req.body;

  if (!reason) {
    return next(new ErrorResponse('A reason is required', 400));
  }

  const reportedUser = await User.findById(req.params.id);
  if (!reportedUser) {
    return next(new ErrorResponse('User not found', 404));
  }

  reportedUser.reports.push({
    reportedBy: req.user.id,
    reason,
    description,
    conversationId: conversationId || undefined,
    createdAt: new Date()
  });
  await reportedUser.save({ validateBeforeSave: false });

  res.status(201).json({ success: true, message: 'Report submitted. Our team will review it.' });
});

// @desc    Search users for dispute filing
// @route   GET /api/v1/users/search
// @access  Private
const searchUsers = asyncHandler(async (req, res, next) => {
  const { query } = req.query;
  
  if (!query || query.trim().length < 2) {
    return res.json({
      success: true,
      data: []
    });
  }

  // Search by name, email, or phone
  const users = await User.find({
    _id: { $ne: req.user._id }, // Exclude current user
    status: 'active',
    $or: [
      { fullName: new RegExp(query, 'i') },
      { email: new RegExp(query, 'i') },
      { phone: new RegExp(query, 'i') }
    ]
  })
  .select('_id fullName email phone avatar role')
  .limit(20);

  res.json({
    success: true,
    data: users
  });
});

module.exports = {
  getProfile,
  updateProfile,
  getUserStats,
  getDashboardOverview,
  getPublicProfile,
  getVerificationStatus,
  uploadIDDocument,
  verifyBiometric,
  getReviews,
  addReview,
  searchUsers,
  toggleBlock,
  reportUser
};