const Dispute = require('../models/Dispute');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const mongoose = require('mongoose');

// @desc    Create a new dispute
// @route   POST /api/v1/disputes
// @access  Private
exports.createDispute = asyncHandler(async (req, res, next) => {
  const {
    respondentId,
    bookingId,
    listingId,
    category,
    subject,
    description,
    evidence,
    requestedAmount
  } = req.body;

  // Verify respondent exists
  const respondent = await User.findById(respondentId);
  if (!respondent) {
    return next(new ErrorResponse('Respondent user not found', 404));
  }

  // Verify booking if provided
  if (bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(new ErrorResponse('Booking not found', 404));
    }
    
    // Verify user is part of the booking
    if (
      booking.renter.toString() !== req.user._id.toString() &&
      booking.owner.toString() !== req.user._id.toString()
    ) {
      return next(new ErrorResponse('You are not authorized to dispute this booking', 403));
    }
  }

  // Verify listing if provided
  if (listingId) {
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return next(new ErrorResponse('Listing not found', 404));
    }
  }

  // Create dispute
  const dispute = await Dispute.create({
    complainant: req.user._id,
    respondent: respondentId,
    booking: bookingId,
    listing: listingId,
    category,
    subject,
    description,
    evidence: evidence || [],
    requestedAmount,
    timeline: [{
      action: 'Dispute created',
      performedBy: req.user._id,
      timestamp: new Date()
    }]
  });

  // Populate for response
  await dispute.populate([
    { path: 'complainant', select: 'fullName email phone avatar' },
    { path: 'respondent', select: 'fullName email phone avatar' },
    { path: 'booking', select: 'bookingId startDate endDate pricing' },
    { path: 'listing', select: 'title images' }
  ]);

  // Notify super admin about new dispute
  const superAdmins = await User.find({ isSuperAdmin: true });
  // TODO: Send notification/email to super admins

  res.status(201).json({
    success: true,
    data: dispute
  });
});

// @desc    Get all disputes for current user (complainant or respondent)
// @route   GET /api/v1/disputes/my-disputes
// @access  Private
exports.getMyDisputes = asyncHandler(async (req, res, next) => {
  const { status, category } = req.query;
  
  const query = {
    $or: [
      { complainant: req.user._id },
      { respondent: req.user._id }
    ]
  };

  if (status) {
    query.status = status;
  }

  if (category) {
    query.category = category;
  }

  const disputes = await Dispute.find(query)
    .populate('complainant', 'fullName email avatar')
    .populate('respondent', 'fullName email avatar')
    .populate('booking', 'bookingId startDate endDate pricing')
    .populate('listing', 'title images')
    .populate('assignedTo', 'fullName email')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: disputes.length,
    data: disputes
  });
});

// @desc    Get single dispute details
// @route   GET /api/v1/disputes/:id
// @access  Private (Only complainant, respondent, or admin)
exports.getDispute = asyncHandler(async (req, res, next) => {
  const dispute = await Dispute.findById(req.params.id)
    .populate('complainant', 'fullName email phone avatar')
    .populate('respondent', 'fullName email phone avatar')
    .populate('booking', 'bookingId startDate endDate pricing')
    .populate('listing', 'title images location')
    .populate('assignedTo', 'fullName email')
    .populate('resolution.resolvedBy', 'fullName')
    .populate('messages.sender', 'fullName avatar')
    .populate('timeline.performedBy', 'fullName');

  if (!dispute) {
    return next(new ErrorResponse('Dispute not found', 404));
  }

  // PRIVACY CHECK: Only allow access to complainant, respondent, or admin
  // This ensures disputes are private one-to-one between the two parties
  if (
    dispute.complainant._id.toString() !== req.user._id.toString() &&
    dispute.respondent._id.toString() !== req.user._id.toString() &&
    !req.user.isSuperAdmin &&
    !req.user.isAdmin
  ) {
    return next(new ErrorResponse('Not authorized to view this dispute', 403));
  }

  res.json({
    success: true,
    data: dispute
  });
});

// @desc    Add message to dispute
// @route   POST /api/v1/disputes/:id/messages
// @access  Private
exports.addDisputeMessage = asyncHandler(async (req, res, next) => {
  const { content, attachments } = req.body;

  const dispute = await Dispute.findById(req.params.id);

  if (!dispute) {
    return next(new ErrorResponse('Dispute not found', 404));
  }

  // Determine sender role
  let senderRole;
  if (dispute.complainant.toString() === req.user._id.toString()) {
    senderRole = 'complainant';
  } else if (dispute.respondent.toString() === req.user._id.toString()) {
    senderRole = 'respondent';
  } else if (req.user.isSuperAdmin || req.user.isAdmin) {
    senderRole = 'admin';
  } else {
    return next(new ErrorResponse('Not authorized to message in this dispute', 403));
  }

  // Add message
  dispute.messages.push({
    sender: req.user._id,
    senderRole,
    content,
    attachments: attachments || [],
    timestamp: new Date()
  });

  // Update timeline
  dispute.timeline.push({
    action: `${senderRole.charAt(0).toUpperCase() + senderRole.slice(1)} added a message`,
    performedBy: req.user._id,
    timestamp: new Date()
  });

  await dispute.save();

  // Populate the latest message
  await dispute.populate([
    { path: 'messages.sender', select: 'fullName avatar' },
    { path: 'complainant', select: 'fullName email' },
    { path: 'respondent', select: 'fullName email' }
  ]);

  // TODO: Send notification to other party

  res.json({
    success: true,
    data: dispute
  });
});

// @desc    Submit respondent response
// @route   POST /api/v1/disputes/:id/respond
// @access  Private
exports.respondToDispute = asyncHandler(async (req, res, next) => {
  const { response, evidence } = req.body;

  const dispute = await Dispute.findById(req.params.id);

  if (!dispute) {
    return next(new ErrorResponse('Dispute not found', 404));
  }

  // Verify user is the respondent
  if (dispute.respondent.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Only the respondent can submit a response', 403));
  }

  if (dispute.respondentResponse.submitted) {
    return next(new ErrorResponse('Response already submitted', 400));
  }

  // Update respondent response
  dispute.respondentResponse = {
    submitted: true,
    submittedAt: new Date(),
    response,
    evidence: evidence || []
  };

  // Update status
  dispute.status = 'under_review';

  // Update timeline
  dispute.timeline.push({
    action: 'Respondent submitted response',
    performedBy: req.user._id,
    timestamp: new Date()
  });

  await dispute.save();

  res.json({
    success: true,
    data: dispute
  });
});

// @desc    Get all disputes (Admin only)
// @route   GET /api/v1/disputes/admin/all
// @access  Private/Admin
exports.getAllDisputes = asyncHandler(async (req, res, next) => {
  const { status, priority, category, assignedTo } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const query = {};

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;
  if (assignedTo) query.assignedTo = assignedTo;

  const total = await Dispute.countDocuments(query);

  const disputes = await Dispute.find(query)
    .populate('complainant', 'fullName email avatar')
    .populate('respondent', 'fullName email avatar')
    .populate('booking', 'bookingId')
    .populate('listing', 'title')
    .populate('assignedTo', 'fullName')
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip);

  res.json({
    success: true,
    count: disputes.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: disputes
  });
});

// @desc    Assign dispute to admin
// @route   PUT /api/v1/disputes/:id/assign
// @access  Private/SuperAdmin
exports.assignDispute = asyncHandler(async (req, res, next) => {
  const { adminId } = req.body;

  const dispute = await Dispute.findById(req.params.id);

  if (!dispute) {
    return next(new ErrorResponse('Dispute not found', 404));
  }

  // Verify admin exists and is admin/superadmin
  const admin = await User.findById(adminId);
  if (!admin || (!admin.isAdmin && !admin.isSuperAdmin)) {
    return next(new ErrorResponse('Invalid admin user', 400));
  }

  dispute.assignedTo = adminId;
  dispute.assignedAt = new Date();
  dispute.status = 'investigating';

  dispute.timeline.push({
    action: `Dispute assigned to ${admin.fullName}`,
    performedBy: req.user._id,
    timestamp: new Date()
  });

  await dispute.save();

  res.json({
    success: true,
    data: dispute
  });
});

// @desc    Update dispute status
// @route   PUT /api/v1/disputes/:id/status
// @access  Private/Admin
exports.updateDisputeStatus = asyncHandler(async (req, res, next) => {
  const { status, priority, internalNote } = req.body;

  const dispute = await Dispute.findById(req.params.id);

  if (!dispute) {
    return next(new ErrorResponse('Dispute not found', 404));
  }

  if (status) {
    dispute.status = status;
  }

  if (priority) {
    dispute.priority = priority;
  }

  if (internalNote) {
    dispute.internalNotes.push({
      note: internalNote,
      createdBy: req.user._id,
      createdAt: new Date()
    });
  }

  dispute.timeline.push({
    action: `Status updated to ${status}`,
    performedBy: req.user._id,
    timestamp: new Date()
  });

  await dispute.save();

  res.json({
    success: true,
    data: dispute
  });
});

// @desc    Resolve dispute
// @route   PUT /api/v1/disputes/:id/resolve
// @access  Private/SuperAdmin
exports.resolveDispute = asyncHandler(async (req, res, next) => {
  const { decision, explanation, action, awardedAmount } = req.body;

  const dispute = await Dispute.findById(req.params.id);

  if (!dispute) {
    return next(new ErrorResponse('Dispute not found', 404));
  }

  dispute.status = 'resolved';
  dispute.resolution = {
    decision,
    explanation,
    action,
    resolvedBy: req.user._id,
    resolvedAt: new Date()
  };

  if (awardedAmount !== undefined) {
    dispute.awardedAmount = awardedAmount;
  }

  dispute.timeline.push({
    action: 'Dispute resolved',
    performedBy: req.user._id,
    timestamp: new Date(),
    notes: decision
  });

  await dispute.save();

  // TODO: Send notification to both parties
  // TODO: Process refund if applicable

  res.json({
    success: true,
    data: dispute
  });
});

// @desc    Close dispute
// @route   PUT /api/v1/disputes/:id/close
// @access  Private/Admin
exports.closeDispute = asyncHandler(async (req, res, next) => {
  const { closureReason } = req.body;

  const dispute = await Dispute.findById(req.params.id);

  if (!dispute) {
    return next(new ErrorResponse('Dispute not found', 404));
  }

  dispute.status = 'closed';
  dispute.closedAt = new Date();
  dispute.closureReason = closureReason;

  dispute.timeline.push({
    action: 'Dispute closed',
    performedBy: req.user._id,
    timestamp: new Date(),
    notes: closureReason
  });

  await dispute.save();

  res.json({
    success: true,
    data: dispute
  });
});

// @desc    Get dispute statistics (Admin)
// @route   GET /api/v1/disputes/admin/statistics
// @access  Private/Admin
exports.getDisputeStatistics = asyncHandler(async (req, res, next) => {
  const stats = await Dispute.aggregate([
    {
      $facet: {
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        byCategory: [
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ],
        byPriority: [
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ],
        totalAwarded: [
          { $group: { _id: null, total: { $sum: '$awardedAmount' } } }
        ],
        avgResolutionTime: [
          {
            $match: { status: 'resolved', 'resolution.resolvedAt': { $exists: true } }
          },
          {
            $project: {
              resolutionTime: {
                $subtract: ['$resolution.resolvedAt', '$createdAt']
              }
            }
          },
          {
            $group: {
              _id: null,
              avgTime: { $avg: '$resolutionTime' }
            }
          }
        ]
      }
    }
  ]);

  res.json({
    success: true,
    data: stats[0]
  });
});
