const mongoose = require('mongoose');
const { generateTransactionId } = require('../utils/otpGenerator');

const paymentSchema = new mongoose.Schema({
  // Payment Identification
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Stripe Payment Intent ID
  stripePaymentIntentId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Related Entities
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Payer is required']
  },
  payee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  },

  // Payment Details
  amount: {
    subtotal: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    deposit: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, enum: ['PKR', 'USD'], default: 'PKR' }
  },

  // Payment Method
  method: {
    type: String,
    enum: ['jazzcash', 'easypaisa', 'card', 'bank_transfer', 'wallet', 'stripe'],
    required: [true, 'Payment method is required']
  },
  
  // Payment Gateway Details
  gateway: {
    provider: {
      type: String,
      enum: ['jazzcash', 'easypaisa', 'stripe', 'local_bank']
    },
    transactionId: String,
    reference: String,
    response: mongoose.Schema.Types.Mixed
  },

  // Payment Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partial_refund'],
    default: 'pending'
  },
  
  // Refund Information
  refund: {
    amount: { type: Number, default: 0 },
    reason: String,
    status: {
      type: String,
      enum: ['none', 'pending', 'processing', 'completed', 'failed'],
      default: 'none'
    },
    processedAt: Date,
    refundId: String
  },

  // Payout Information (for owner earnings)
  payout: {
    amount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    method: String,
    processedAt: Date,
    payoutId: String
  },

  // Important Dates
  initiatedAt: { type: Date, default: Date.now },
  completedAt: Date,
  failedAt: Date,
  refundedAt: Date,

  // Additional Information
  description: String,
  metadata: {
    userAgent: String,
    ipAddress: String,
    deviceInfo: String
  },

  // Webhook and Callback URLs
  webhookData: mongoose.Schema.Types.Mixed,
  callbackUrl: String,
  returnUrl: String,

  // Security and Fraud Detection
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  fraudFlags: [String],
  
  // Admin Notes
  adminNotes: String,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ booking: 1 });
paymentSchema.index({ payer: 1, status: 1 });
paymentSchema.index({ payee: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ method: 1 });
paymentSchema.index({ 'gateway.provider': 1, 'gateway.transactionId': 1 });
paymentSchema.index({ createdAt: -1 });

// Compound indexes for common queries
paymentSchema.index({ payer: 1, status: 1, createdAt: -1 });
paymentSchema.index({ payee: 1, 'payout.status': 1, createdAt: -1 });

// Virtual for net amount (amount after fees)
paymentSchema.virtual('netAmount').get(function() {
  return this.amount.total - (this.amount.serviceFee || 0) - (this.amount.taxes || 0);
});

// Virtual for owner earnings (amount minus platform fees)
paymentSchema.virtual('ownerEarnings').get(function() {
  const platformFee = this.amount.serviceFee || 0;
  return this.amount.subtotal - (platformFee * 0.7);
});

// Virtual for payment status display
paymentSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    partial_refund: 'Partially Refunded'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for time since payment
paymentSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
});

// Pre-save middleware to generate transaction ID
paymentSchema.pre('save', function(next) {
  if (this.isNew && !this.transactionId) {
    this.transactionId = generateTransactionId();
  }
  next();
});

// Pre-save middleware to update timestamps
paymentSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  
  // Set completion timestamp when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Set failed timestamp when status changes to failed
  if (this.isModified('status') && this.status === 'failed' && !this.failedAt) {
    this.failedAt = new Date();
  }
  
  next();
});

// Method to mark payment as completed
paymentSchema.methods.markCompleted = function(gatewayResponse = {}) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.gateway.response = gatewayResponse;
  
  // Calculate owner payout
  this.payout.amount = this.ownerEarnings;
  this.payout.status = 'pending';
  
  return this.save();
};

// Method to mark payment as failed
paymentSchema.methods.markFailed = function(reason = '', gatewayResponse = {}) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.gateway.response = gatewayResponse;
  this.adminNotes = reason;
  
  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = function(refundAmount, reason = '') {
  if (this.status !== 'completed') {
    throw new Error('Can only refund completed payments');
  }
  
  if (refundAmount > this.amount) {
    throw new Error('Refund amount cannot exceed payment amount');
  }
  
  this.refund.amount = refundAmount;
  this.refund.reason = reason;
  this.refund.status = 'pending';
  
  if (refundAmount === this.amount) {
    this.status = 'refunded';
  } else {
    this.status = 'partial_refund';
  }
  
  this.refundedAt = new Date();
  
  return this.save();
};

// Method to process owner payout
paymentSchema.methods.processPayout = function(payoutMethod, payoutId = '') {
  if (this.status !== 'completed') {
    throw new Error('Can only payout from completed payments');
  }
  
  this.payout.status = 'processing';
  this.payout.method = payoutMethod;
  this.payout.payoutId = payoutId;
  
  return this.save();
};

// Method to complete payout
paymentSchema.methods.completePayout = function() {
  this.payout.status = 'completed';
  this.payout.processedAt = new Date();
  
  return this.save();
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = function(userId, role = 'user') {
  const matchField = role === 'owner' ? 'ownerId' : 'userId';
  
  return this.aggregate([
    { $match: { [matchField]: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        totalAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
        },
        totalRefunded: { $sum: '$refund.amount' },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);
};

// Static method to get earnings by period
paymentSchema.statics.getEarningsByPeriod = function(ownerId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        ownerId: mongoose.Types.ObjectId(ownerId),
        status: 'completed',
        completedAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$completedAt' },
          month: { $month: '$completedAt' },
          day: { $dayOfMonth: '$completedAt' }
        },
        totalEarnings: { $sum: '$payout.amount' },
        transactionCount: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);