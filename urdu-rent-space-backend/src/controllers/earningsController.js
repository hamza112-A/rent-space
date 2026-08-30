const User = require('../models/User');
const Payment = require('../models/Payment');
const Payout = require('../models/Payout');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const mongoose = require('mongoose');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe Connect isn't available for Pakistan-based accounts (Pakistan isn't
// a Stripe Connect-supported country), so this only ever runs in Stripe test
// mode against a supported test country. It exists so the automated-payout
// flow has something real to develop and demo against; the payout rail that
// will actually work for Pakistani owners is the manual one below
// (bank_transfer/jazzcash/easypaisa, processed by an admin). See
// docs/redesign/08-earnings.md.
const STRIPE_CONNECT_COUNTRY = process.env.STRIPE_CONNECT_COUNTRY || 'GB';

// @desc    Get earnings summary
// @route   GET /api/v1/earnings/summary
// @access  Private (Owner only)
const getEarningsSummary = asyncHandler(async (req, res, next) => {
  const { period = 'month' } = req.query;
  const userId = new mongoose.Types.ObjectId(req.user._id);

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

  // Earnings = what the owner is actually owed: subtotal minus the platform's
  // tiered commission, not the gross amount the borrower paid (amount.total,
  // which also includes the borrower's service fee). See Payment.ownerEarnings.
  const NET_EARNINGS_EXPR = { $subtract: ['$amount.subtotal', { $ifNull: ['$amount.commission', 0] }] };
  const earningsData = await Payment.aggregate([
    {
      $match: {
        payee: userId,
        status: 'completed',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: NET_EARNINGS_EXPR },
        totalTransactions: { $sum: 1 },
        avgTransactionAmount: { $avg: NET_EARNINGS_EXPR }
      }
    }
  ]);

  // Get pending payouts
  const pendingPayouts = await Payment.aggregate([
    {
      $match: {
        payee: userId,
        status: 'completed',
        'payout.status': { $in: ['pending', 'processing'] }
      }
    },
    {
      $group: {
        _id: null,
        pendingAmount: { $sum: '$payout.amount' }
      }
    }
  ]);

  const totalEarnings = earningsData[0]?.totalEarnings || 0;
  const pendingPayout = pendingPayouts[0]?.pendingAmount || 0;

  // Available balance is a current snapshot ("how much can I withdraw right
  // now"), not scoped to the selected reporting period — computed the same
  // way requestPayout validates it, so the UI and the payout endpoint never
  // disagree on the number.
  const availableBalance = await calculateAvailableBalance(req.user._id);

  // Get this month's data for growth calculation
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const lastMonthStart = new Date(thisMonthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

  const [thisMonthData, lastMonthData] = await Promise.all([
    Payment.aggregate([
      {
        $match: {
          payee: userId,
          status: 'completed',
          createdAt: { $gte: thisMonthStart }
        }
      },
      {
        $group: {
          _id: null,
          monthlyEarnings: { $sum: NET_EARNINGS_EXPR },
          monthlyBookings: { $sum: 1 }
        }
      }
    ]),
    Payment.aggregate([
      {
        $match: {
          payee: userId,
          status: 'completed',
          createdAt: { $gte: lastMonthStart, $lt: thisMonthStart }
        }
      },
      {
        $group: {
          _id: null,
          monthlyEarnings: { $sum: NET_EARNINGS_EXPR }
        }
      }
    ])
  ]);

  const monthlyEarnings = thisMonthData[0]?.monthlyEarnings || 0;
  const monthlyBookings = thisMonthData[0]?.monthlyBookings || 0;
  const lastMonthEarnings = lastMonthData[0]?.monthlyEarnings || 0;
  const growth = lastMonthEarnings > 0
    ? Math.round(((monthlyEarnings - lastMonthEarnings) / lastMonthEarnings) * 1000) / 10
    : (monthlyEarnings > 0 ? 100 : 0);

  // Get chart data (last 6 months)
  const chartData = await Payment.aggregate([
    {
      $match: {
        payee: userId,
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
        amount: { $sum: NET_EARNINGS_EXPR }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

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
        growth
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
  const userId = new mongoose.Types.ObjectId(req.user._id);

  let matchQuery = { payee: userId };

  if (type !== 'all') {
    matchQuery.type = type;
  }

  const transactions = await Payment.find(matchQuery)
    .populate('booking', 'startDate endDate')
    .populate('listing', 'title images')
    .populate('payer', 'fullName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Payment.countDocuments(matchQuery);

  // Transform transactions for frontend
  const formattedTransactions = transactions.map(t => ({
    _id: t._id,
    type: 'earning',
    amount: (t.amount?.subtotal || 0) - (t.amount?.commission || 0),
    status: t.status,
    payoutStatus: t.payout?.status || 'pending',
    createdAt: t.createdAt,
    bookingId: {
      listing: t.listing
    }
  }));

  res.status(200).json({
    success: true,
    data: {
      transactions: formattedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Request payout of the full available balance
// @route   POST /api/v1/earnings/payout
// @access  Private (Owner only)
//
// Payouts are all-or-nothing (the full available balance) rather than an
// arbitrary amount, so a payout always cleanly matches a set of completed
// Payment records — no partial-payment ledger bookkeeping to get wrong.
const requestPayout = asyncHandler(async (req, res, next) => {
  const { method } = req.body;
  const userId = req.user.id;

  if (!method || !['stripe', 'bank_transfer', 'jazzcash', 'easypaisa'].includes(method)) {
    return next(new ErrorResponse('Valid payout method is required', 400));
  }

  const availableBalance = await calculateAvailableBalance(userId);

  if (availableBalance <= 0) {
    return next(new ErrorResponse('No available balance to pay out', 400));
  }

  const user = await User.findById(userId);
  const amount = Math.round(availableBalance * 100) / 100;

  if (method === 'stripe') {
    if (!user.stripeConnect?.accountId || !user.stripeConnect?.payoutsEnabled) {
      return next(new ErrorResponse('Complete Stripe onboarding before requesting a Stripe payout', 400));
    }

    const payout = await Payout.create({
      user: userId,
      amount,
      currency: 'PKR',
      method: 'stripe',
      status: 'processing',
      destination: { accountId: user.stripeConnect.accountId }
    });

    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: 'pkr',
        destination: user.stripeConnect.accountId,
        description: `MyRental payout ${payout._id}`,
        metadata: { payoutId: payout._id.toString(), userId: userId.toString() }
      });

      payout.stripeTransferId = transfer.id;
      payout.status = 'paid';
      payout.processedAt = new Date();
      await payout.save();

      await attachPayoutToPayments(userId, payout._id, 'completed', 'stripe');

      return res.status(200).json({
        success: true,
        data: { payoutId: payout._id, amount, status: payout.status }
      });
    } catch (err) {
      payout.status = 'failed';
      payout.failureReason = err.message;
      await payout.save();
      return next(new ErrorResponse(`Stripe payout failed: ${err.message}`, 502));
    }
  }

  // Manual rails: no gateway integration exists for these yet, so the payout
  // is recorded as pending until an admin actually sends the money outside
  // the platform and marks it paid.
  const payoutMethodOnFile = (user.payoutMethods || []).find(m => m.type === method);
  if (!payoutMethodOnFile) {
    return next(new ErrorResponse(`Add a ${method.replace('_', ' ')} payout method before requesting a payout`, 400));
  }

  const payout = await Payout.create({
    user: userId,
    amount,
    currency: 'PKR',
    method,
    status: 'pending',
    destination: payoutMethodOnFile.details
  });

  await attachPayoutToPayments(userId, payout._id, 'processing', method);

  res.status(200).json({
    success: true,
    data: {
      payoutId: payout._id,
      amount,
      status: 'pending',
      note: 'This payout method is processed manually by our team, typically within 1-3 business days.'
    }
  });
});

// @desc    Get payout methods (bank/jazzcash/easypaisa on file)
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

  if (!details || typeof details !== 'object') {
    return next(new ErrorResponse('Payout method details are required', 400));
  }

  const user = await User.findById(req.user.id);

  if (!user.payoutMethods) {
    user.payoutMethods = [];
  }

  if (isDefault) {
    user.payoutMethods.forEach(method => {
      method.isDefault = false;
    });
  }

  user.payoutMethods.push({
    type,
    details: {
      mobileNumber: details.mobileNumber,
      accountTitle: details.accountTitle,
      bankName: details.bankName,
      accountNumber: details.accountNumber,
      branchCode: details.branchCode
    },
    isDefault: isDefault || user.payoutMethods.length === 0,
    createdAt: new Date()
  });

  await user.save();

  res.status(201).json({
    success: true,
    data: user.payoutMethods[user.payoutMethods.length - 1]
  });
});

// @desc    Delete a payout method
// @route   DELETE /api/v1/earnings/payout-methods/:id
// @access  Private (Owner only)
const deletePayoutMethod = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user.payoutMethods || user.payoutMethods.length === 0) {
    return next(new ErrorResponse('Payout method not found', 404));
  }

  const index = user.payoutMethods.findIndex(m => m._id.toString() === req.params.id);
  if (index === -1) {
    return next(new ErrorResponse('Payout method not found', 404));
  }

  const wasDefault = user.payoutMethods[index].isDefault;
  user.payoutMethods.splice(index, 1);

  if (wasDefault && user.payoutMethods.length > 0) {
    user.payoutMethods[0].isDefault = true;
  }

  await user.save();

  res.status(200).json({ success: true, message: 'Payout method removed' });
});

// @desc    Get Stripe Connect onboarding status
// @route   GET /api/v1/earnings/connect/status
// @access  Private (Owner only)
const getConnectStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('stripeConnect');

  res.status(200).json({
    success: true,
    data: {
      connected: !!user.stripeConnect?.accountId,
      payoutsEnabled: !!user.stripeConnect?.payoutsEnabled,
      detailsSubmitted: !!user.stripeConnect?.detailsSubmitted
    }
  });
});

// @desc    Start (or resume) Stripe Connect Express onboarding
// @route   POST /api/v1/earnings/connect/onboard
// @access  Private (Owner only)
const createConnectOnboardingLink = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  let accountId = user.stripeConnect?.accountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: STRIPE_CONNECT_COUNTRY,
      email: user.email,
      capabilities: {
        transfers: { requested: true }
      },
      business_type: 'individual',
      metadata: { userId: user._id.toString() }
    });

    accountId = account.id;
    user.stripeConnect.accountId = accountId;
    user.stripeConnect.country = STRIPE_CONNECT_COUNTRY;
    user.stripeConnect.updatedAt = new Date();
    await user.save();
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${frontendUrl}/dashboard?tab=earnings&connect=refresh`,
    return_url: `${frontendUrl}/dashboard?tab=earnings&connect=return`,
    type: 'account_onboarding'
  });

  res.status(200).json({
    success: true,
    data: { url: accountLink.url }
  });
});

// Helper: sync a user's Stripe Connect account status from Stripe. Called
// after onboarding return and can also be wired to an `account.updated`
// webhook later for real-time sync.
const syncConnectStatus = async (userId) => {
  const user = await User.findById(userId);
  if (!user?.stripeConnect?.accountId) return null;

  const account = await stripe.accounts.retrieve(user.stripeConnect.accountId);

  user.stripeConnect.detailsSubmitted = !!account.details_submitted;
  user.stripeConnect.payoutsEnabled = !!account.payouts_enabled;
  user.stripeConnect.chargesEnabled = !!account.charges_enabled;
  user.stripeConnect.updatedAt = new Date();
  await user.save();

  return user.stripeConnect;
};

// @desc    Re-sync Stripe Connect account status (called after onboarding return)
// @route   POST /api/v1/earnings/connect/sync
// @access  Private (Owner only)
const refreshConnectStatus = asyncHandler(async (req, res, next) => {
  const status = await syncConnectStatus(req.user.id);

  if (!status) {
    return next(new ErrorResponse('No Stripe Connect account found', 404));
  }

  res.status(200).json({ success: true, data: status });
});

// Mark completed Payments (payee=user, payout.status: pending) as belonging
// to this payout, and move them to the given status. Since requestPayout
// always pays out the full available balance, this exactly covers every
// pending-payout payment for the user.
const attachPayoutToPayments = async (userId, payoutId, status, method) => {
  const payments = await Payment.find({
    payee: userId,
    status: 'completed',
    'payout.status': 'pending'
  });

  for (const payment of payments) {
    payment.payout.status = status;
    payment.payout.method = method;
    payment.payout.payoutId = payoutId.toString();
    if (status === 'completed') {
      payment.payout.processedAt = new Date();
    }
    await payment.save();
  }

  return payments;
};

// Helper function to calculate available balance: net earnings from
// completed bookings, minus anything already pending/processing/paid out.
const calculateAvailableBalance = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const totalEarnings = await Payment.aggregate([
    {
      $match: {
        payee: userObjectId,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: { $subtract: ['$amount.subtotal', { $ifNull: ['$amount.commission', 0] }] } }
      }
    }
  ]);

  const alreadyAccountedFor = await Payment.aggregate([
    {
      $match: {
        payee: userObjectId,
        status: 'completed',
        'payout.status': { $in: ['processing', 'completed'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$payout.amount' }
      }
    }
  ]);

  const earnings = totalEarnings[0]?.total || 0;
  const accountedFor = alreadyAccountedFor[0]?.total || 0;

  return earnings - accountedFor;
};

module.exports = {
  getEarningsSummary,
  getEarningsTransactions,
  requestPayout,
  getPayoutMethods,
  addPayoutMethod,
  deletePayoutMethod,
  getConnectStatus,
  createConnectOnboardingLink,
  refreshConnectStatus
};
