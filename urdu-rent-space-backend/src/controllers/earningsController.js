const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get earnings summary
// @route   GET /api/v1/earnings/summary
// @access  Private (Owner only)
const getEarningsSummary = asyncHandler(async (req, res, next) => {
  const { period = 'month' } = req.query;
  const userId = req.user.id;

  // Calculate date range based on period
  let startDate = new Date();
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate = new Date(0); // All time
  }

  // Get earnings data
  const earningsData = await Payment.aggregate([
    {
      $match: {
        userId: userId,
        status: 'completed',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        avgTransactionAmount: { $avg: '$amount' }
      }
    }
  ]);

  // Get pending payouts
  const pendingPayouts = await Payment.aggregate([
    {
      $match: {
        userId: userId,
        status: 'completed',
        payoutStatus: { $in: ['pending', 'processing'] }
      }
    },
    {
      $group: {
        _id: null,
        pendingAmount: { $sum: '$amount' }
      }
    }
  ]);

  // Get available balance (completed payments minus processed payouts)
  const processedPayouts = await Payment.aggregate([
    {
      $match: {
        userId: userId,
        payoutStatus: 'processed'
      }
    },
    {
      $group: {
        _id: null,
        processedAmount: { $sum: '$amount' }
      }
    }
  ]);

  const totalEarnings = earningsData[0]?.totalEarnings || 0;
  const pendingPayout = pendingPayouts[0]?.pendingAmount || 0;
  const processedAmount = processedPayouts[0]?.processedAmount || 0;
  const availableBalance = totalEarnings - processedAmount - pendingPayout;

  // Get this month's data for growth calculation
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const thisMonthData = await Payment.aggregate([
    {
      $match: {
        userId: userId,
        status: 'completed',
        createdAt: { $gte: thisMonthStart }
      }
    },
    {
      $group: {
        _id: null,
        monthlyEarnings: { $sum: '$amount' },
        monthlyBookings: { $sum: 1 }
      }
    }
  ]);

  // Get chart data (last 6 months)
  const chartData = await Payment.aggregate([
    {
      $match: {
        userId: userId,
        status: 'completed',
        createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        amount: { $sum: '$amount' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  const monthlyEarnings = thisMonthData[0]?.monthlyEarnings || 0;
  const monthlyBookings = thisMonthData[0]?.monthlyBookings || 0;

  res.status(200).json({
    success: true,
    data: {
      totalEarnings,
      pendingPayout,
      availableBalance,
      currency: 'PKR',
      thisMonth: {
        earnings: monthlyEarnings,
        bookings: monthlyBookings,
        growth: 15.5 // This would be calculated based on previous month
      },
      chart: chartData.map(item => ({
        date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-01`,
        amount: item.amount
      }))
    }
  });
});

// @desc    Get earnings transactions
// @route   GET /api/v1/earnings/transactions
// @access  Private (Owner only)
const getEarningsTransactions = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, type = 'all' } = req.query;
  const userId = req.user.id;

  let matchQuery = { userId };

  if (type !== 'all') {
    matchQuery.type = type;
  }

  const transactions = await Payment.find(matchQuery)
    .populate('bookingId', 'listing startDate endDate')
    .populate({
      path: 'bookingId',
      populate: {
        path: 'listing',
        select: 'title images'
      }
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Payment.countDocuments(matchQuery);

  res.status(200).json({
    success: true,
    data: {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Request payout
// @route   POST /api/v1/earnings/payout
// @access  Private (Owner only)
const requestPayout = asyncHandler(async (req, res, next) => {
  const { amount, method, bankDetails } = req.body;
  const userId = req.user.id;

  // Validate input
  if (!amount || amount <= 0) {
    return next(new ErrorResponse('Valid amount is required', 400));
  }

  if (!method || !['bank_transfer', 'jazzcash', 'easypaisa'].includes(method)) {
    return next(new ErrorResponse('Valid payout method is required', 400));
  }

  // Check available balance
  const availableBalance = await calculateAvailableBalance(userId);

  if (amount > availableBalance) {
    return next(new ErrorResponse('Insufficient balance for payout', 400));
  }

  // Create payout request
  const Payout = require('../models/Payout');
  const payout = await Payout.create({
    userId,
    amount,
    method,
    bankDetails,
    status: 'pending',
    requestedAt: new Date()
  });

  res.status(200).json({
    success: true,
    data: {
      payoutId: payout._id,
      amount,
      status: 'processing',
      estimatedArrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
    }
  });
});

// @desc    Get payout methods
// @route   GET /api/v1/earnings/payout-methods
// @access  Private (Owner only)
const getPayoutMethods = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('payoutMethods');

  res.status(200).json({
    success: true,
    data: user.payoutMethods || []
  });
});

// @desc    Add payout method
// @route   POST /api/v1/earnings/payout-methods
// @access  Private (Owner only)
const addPayoutMethod = asyncHandler(async (req, res, next) => {
  const { type, details, isDefault } = req.body;

  if (!type || !['bank_transfer', 'jazzcash', 'easypaisa'].includes(type)) {
    return next(new ErrorResponse('Valid payout method type is required', 400));
  }

  const user = await User.findById(req.user.id);

  if (!user.payoutMethods) {
    user.payoutMethods = [];
  }

  // If this is set as default, unset others
  if (isDefault) {
    user.payoutMethods.forEach(method => {
      method.isDefault = false;
    });
  }

  user.payoutMethods.push({
    type,
    details,
    isDefault: isDefault || user.payoutMethods.length === 0,
    createdAt: new Date()
  });

  await user.save();

  res.status(201).json({
    success: true,
    data: {
      message: 'Payout method added successfully'
    }
  });
});

// Helper function to calculate available balance
const calculateAvailableBalance = async (userId) => {
  const totalEarnings = await Payment.aggregate([
    {
      $match: {
        userId: userId,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const processedPayouts = await Payment.aggregate([
    {
      $match: {
        userId: userId,
        payoutStatus: { $in: ['processed', 'processing'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const earnings = totalEarnings[0]?.total || 0;
  const payouts = processedPayouts[0]?.total || 0;

  return earnings - payouts;
};

module.exports = {
  getEarningsSummary,
  getEarningsTransactions,
  requestPayout,
  getPayoutMethods,
  addPayoutMethod
};