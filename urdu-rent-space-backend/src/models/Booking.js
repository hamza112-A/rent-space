const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Basic Information
  bookingId: {
    type: String,
    unique: true
  },

  // Parties Involved
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: [true, 'Listing is required']
  },
  renter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Renter is required']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required']
  },

  // Booking Details
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  duration: {
    value: { type: Number, required: true },
    unit: { 
      type: String, 
      enum: ['hours', 'days', 'weeks', 'months'],
      required: true 
    }
  },

  // Pricing Information
  pricing: {
    priceType: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly'],
      required: true
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative']
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative']
    },
    serviceFee: {
      type: Number,
      default: 0,
      min: [0, 'Service fee cannot be negative']
    },
    additionalFees: [{
      name: String,
      amount: Number,
      description: String
    }],
    deposit: {
      type: Number,
      default: 0,
      min: [0, 'Deposit cannot be negative']
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    currency: {
      type: String,
      enum: ['PKR', 'USD'],
      default: 'PKR'
    }
  },

  // Guest Information
  guestCount: {
    type: Number,
    default: 1,
    min: [1, 'Guest count must be at least 1']
  },
  guestDetails: {
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    infants: { type: Number, default: 0 }
  },

  // Booking Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'in_progress', 'overdue'],
    default: 'pending'
  },
  
  // Payment Status
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },

  // Messages and Communication
  message: {
    type: String,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  ownerResponse: {
    message: String,
    respondedAt: Date
  },

  // Cancellation Information
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['renter', 'owner', 'admin']
    },
    cancelledAt: Date,
    reason: String,
    refundAmount: {
      type: Number,
      default: 0
    },
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed', 'not_applicable'],
      default: 'not_applicable'
    },
    cancellationFee: {
      type: Number,
      default: 0
    }
  },

  // Extension Information
  extensions: [{
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    originalEndDate: Date,
    newEndDate: Date,
    additionalAmount: Number,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    requestedAt: { type: Date, default: Date.now },
    respondedAt: Date
  }],

  // Check-in/Check-out Information
  checkIn: {
    scheduledTime: Date,
    actualTime: Date,
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    photos: [{
      public_id: String,
      url: String,
      caption: String
    }]
  },
  checkOut: {
    scheduledTime: Date,
    actualTime: Date,
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    photos: [{
      public_id: String,
      url: String,
      caption: String
    }],
    damageReport: {
      hasDamage: { type: Boolean, default: false },
      description: String,
      photos: [{
        public_id: String,
        url: String,
        caption: String
      }],
      estimatedCost: Number
    }
  },

  // Special Requests and Instructions
  specialRequests: [{
    type: String,
    description: String,
    approved: { type: Boolean, default: false },
    additionalCost: { type: Number, default: 0 }
  }],
  ownerInstructions: String,
  renterNotes: String,

  // Review and Rating
  reviews: {
    renterReview: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      submittedAt: Date
    },
    ownerReview: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      submittedAt: Date
    }
  },

  // Important Dates
  requestedAt: { type: Date, default: Date.now },
  approvedAt: Date,
  rejectedAt: Date,
  completedAt: Date,
  
  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    },
    userAgent: String,
    ipAddress: String,
    referrer: String
  },

  // Admin Notes
  adminNotes: String,
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: String,

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ listing: 1 });
bookingSchema.index({ renter: 1 });
bookingSchema.index({ owner: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ requestedAt: -1 });

// Compound indexes for common queries
bookingSchema.index({ renter: 1, status: 1, createdAt: -1 });
bookingSchema.index({ owner: 1, status: 1, createdAt: -1 });
bookingSchema.index({ listing: 1, status: 1, startDate: 1 });

// Virtual for booking duration in days
bookingSchema.virtual('durationInDays').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for booking status display
bookingSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    pending: 'Pending Approval',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    completed: 'Completed',
    in_progress: 'In Progress',
    overdue: 'Overdue'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for time until booking starts
bookingSchema.virtual('timeUntilStart').get(function() {
  const now = new Date();
  const timeDiff = this.startDate - now;
  
  if (timeDiff <= 0) return 'Started';
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return 'Less than an hour';
});

// Virtual for refund eligibility
bookingSchema.virtual('refundEligible').get(function() {
  if (this.status !== 'cancelled') return false;
  if (this.paymentStatus !== 'paid') return false;
  
  const now = new Date();
  const hoursUntilStart = (this.startDate - now) / (1000 * 60 * 60);
  
  // Refund policy based on cancellation time
  if (hoursUntilStart >= 48) return { eligible: true, percentage: 100 };
  if (hoursUntilStart >= 24) return { eligible: true, percentage: 50 };
  return { eligible: false, percentage: 0 };
});

// Pre-save middleware to generate booking ID
bookingSchema.pre('save', function(next) {
  if (this.isNew && !this.bookingId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.bookingId = `BK-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Pre-save middleware to calculate check-in/check-out times
bookingSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('startDate') || this.isModified('endDate')) {
    // Set default check-in time to 3 PM on start date
    if (!this.checkIn.scheduledTime) {
      this.checkIn.scheduledTime = new Date(this.startDate);
      this.checkIn.scheduledTime.setHours(15, 0, 0, 0);
    }
    
    // Set default check-out time to 11 AM on end date
    if (!this.checkOut.scheduledTime) {
      this.checkOut.scheduledTime = new Date(this.endDate);
      this.checkOut.scheduledTime.setHours(11, 0, 0, 0);
    }
  }
  next();
});

// Method to approve booking
bookingSchema.methods.approve = function(ownerMessage = '') {
  this.status = 'approved';
  this.approvedAt = new Date();
  if (ownerMessage) {
    this.ownerResponse = {
      message: ownerMessage,
      respondedAt: new Date()
    };
  }
  return this.save();
};

// Method to reject booking
bookingSchema.methods.reject = function(reason = '') {
  this.status = 'rejected';
  this.rejectedAt = new Date();
  this.ownerResponse = {
    message: reason,
    respondedAt: new Date()
  };
  return this.save();
};

// Method to cancel booking
bookingSchema.methods.cancel = function(cancelledBy, reason = '') {
  this.status = 'cancelled';
  this.cancellation = {
    cancelledBy,
    cancelledAt: new Date(),
    reason
  };
  
  // Calculate refund amount based on cancellation policy
  const refundInfo = this.refundEligible;
  if (refundInfo.eligible) {
    this.cancellation.refundAmount = Math.round(this.pricing.totalAmount * refundInfo.percentage / 100);
    this.cancellation.refundStatus = 'pending';
  }
  
  return this.save();
};

// Method to complete booking
bookingSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Method to check if booking is active
bookingSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'approved' && 
         this.startDate <= now && 
         this.endDate >= now;
};

// Method to check if booking is upcoming
bookingSchema.methods.isUpcoming = function() {
  const now = new Date();
  return this.status === 'approved' && this.startDate > now;
};

// Method to check if booking is overdue
bookingSchema.methods.isOverdue = function() {
  const now = new Date();
  return this.status === 'approved' && 
         this.endDate < now && 
         !this.checkOut.actualTime;
};

// Method to extend booking
bookingSchema.methods.requestExtension = function(requestedBy, newEndDate, additionalAmount) {
  this.extensions.push({
    requestedBy,
    originalEndDate: this.endDate,
    newEndDate: new Date(newEndDate),
    additionalAmount,
    status: 'pending',
    requestedAt: new Date()
  });
  return this.save();
};

// Method to approve extension
bookingSchema.methods.approveExtension = function(extensionId) {
  const extension = this.extensions.id(extensionId);
  if (!extension) throw new Error('Extension not found');
  
  extension.status = 'approved';
  extension.respondedAt = new Date();
  
  // Update booking end date and total amount
  this.endDate = extension.newEndDate;
  this.pricing.totalAmount += extension.additionalAmount;
  
  return this.save();
};

// Method to perform check in
bookingSchema.methods.performCheckIn = function(confirmedBy, notes = '', photos = []) {
  this.checkIn.actualTime = new Date();
  this.checkIn.confirmedBy = confirmedBy;
  this.checkIn.notes = notes;
  this.checkIn.photos = photos;
  
  if (this.status === 'approved') {
    this.status = 'in_progress';
  }
  
  return this.save();
};

// Method to perform check out
bookingSchema.methods.performCheckOut = function(confirmedBy, notes = '', photos = [], damageReport = null) {
  this.checkOut.actualTime = new Date();
  this.checkOut.confirmedBy = confirmedBy;
  this.checkOut.notes = notes;
  this.checkOut.photos = photos;
  
  if (damageReport) {
    this.checkOut.damageReport = damageReport;
  }
  
  this.status = 'completed';
  this.completedAt = new Date();
  
  return this.save();
};

// Static method to find conflicting bookings
bookingSchema.statics.findConflicting = function(listingId, startDate, endDate, excludeBookingId = null) {
  const query = {
    listing: listingId,
    status: { $in: ['approved', 'in_progress'] },
    $or: [
      {
        startDate: { $lte: new Date(endDate) },
        endDate: { $gte: new Date(startDate) }
      }
    ]
  };
  
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  
  return this.find(query);
};

// Static method to get booking statistics
bookingSchema.statics.getStats = function(userId, role = 'renter') {
  const matchField = role === 'renter' ? 'renter' : 'owner';
  
  return this.aggregate([
    { $match: { [matchField]: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        totalSpent: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$pricing.totalAmount', 0] }
        },
        averageRating: { $avg: '$reviews.renterReview.rating' }
      }
    }
  ]);
};

module.exports = mongoose.model('Booking', bookingSchema);