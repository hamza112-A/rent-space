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
  const { fullName, bio, phone, location, preferences } = req.body;

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

// @desc    Get public user profile
// @route   GET /api/v1/users/:id
// @access  Public
const getPublicProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('fullName avatar bio rating responseRate responseTime stats createdAt verification.email.verified verification.phone.verified verification.identity.verified');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Increment profile views if viewer is different user
  if (req.user && req.user.id !== req.params.id) {
    user.stats.profileViews += 1;
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    success: true,
    data: user
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
  const { page = 1, limit = 10, sortBy = 'recent' } = req.query;

  const Review = require('../models/Review');

  let sortOptions = { createdAt: -1 };
  if (sortBy === 'highest') sortOptions = { rating: -1, createdAt: -1 };
  if (sortBy === 'lowest') sortOptions = { rating: 1, createdAt: -1 };

  const reviews = await Review.find({ revieweeId: req.params.id })
    .populate('reviewerId', 'fullName avatar')
    .populate('listingId', 'title')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Review.countDocuments({ revieweeId: req.params.id });

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

  // Create review
  const review = await Review.create({
    bookingId,
    reviewerId: req.user.id,
    revieweeId: req.params.id,
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
  getPublicProfile,
  getVerificationStatus,
  uploadIDDocument,
  verifyBiometric,
  getReviews,
  addReview,
  searchUsers
};