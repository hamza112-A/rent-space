const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Booking Reference
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking ID is required']
  },

  // Parties Involved
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewer ID is required']
  },
  revieweeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewee ID is required']
  },

  // Listing Reference (optional, for listing-specific reviews)
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  },

  // Review Content
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    trim: true
  },

  // Review Categories (for detailed feedback)
  categories: {
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    cleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    accuracy: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    },
    location: {
      type: Number,
      min: 1,
      max: 5
    }
  },

  // Response from reviewee
  response: {
    comment: {
      type: String,
      maxlength: [500, 'Response cannot exceed 500 characters'],
      trim: true
    },
    respondedAt: Date
  },

  // Review Status
  status: {
    type: String,
    enum: ['active', 'hidden', 'reported', 'deleted'],
    default: 'active'
  },

  // Helpful votes
  helpfulVotes: {
    count: {
      type: Number,
      default: 0
    },
    voters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },

  // Moderation
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: String,
  moderationNotes: String,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
reviewSchema.index({ revieweeId: 1, createdAt: -1 });
reviewSchema.index({ reviewerId: 1, createdAt: -1 });
reviewSchema.index({ bookingId: 1 });
reviewSchema.index({ listingId: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ status: 1 });

// Compound indexes
reviewSchema.index({ revieweeId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ listingId: 1, status: 1, rating: -1 });

// Ensure one review per booking per reviewer-reviewee pair
reviewSchema.index({ bookingId: 1, reviewerId: 1, revieweeId: 1 }, { unique: true });

// Virtual for average category rating
reviewSchema.virtual('categoryAverage').get(function() {
  if (!this.categories) return null;
  
  const categories = Object.values(this.categories).filter(rating => rating > 0);
  if (categories.length === 0) return null;
  
  return categories.reduce((sum, rating) => sum + rating, 0) / categories.length;
});

// Virtual for time since review
reviewSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
});

// Method to add helpful vote
reviewSchema.methods.addHelpfulVote = function(userId) {
  if (!this.helpfulVotes.voters.includes(userId)) {
    this.helpfulVotes.voters.push(userId);
    this.helpfulVotes.count += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove helpful vote
reviewSchema.methods.removeHelpfulVote = function(userId) {
  const index = this.helpfulVotes.voters.indexOf(userId);
  if (index > -1) {
    this.helpfulVotes.voters.splice(index, 1);
    this.helpfulVotes.count = Math.max(0, this.helpfulVotes.count - 1);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to add response
reviewSchema.methods.addResponse = function(responseComment) {
  this.response = {
    comment: responseComment,
    respondedAt: new Date()
  };
  return this.save();
};

// Method to flag review
reviewSchema.methods.flagReview = function(reason) {
  this.flagged = true;
  this.flagReason = reason;
  return this.save();
};

// Static method to get review statistics for a user
reviewSchema.statics.getReviewStats = function(userId) {
  return this.aggregate([
    { $match: { revieweeId: mongoose.Types.ObjectId(userId), status: 'active' } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        },
        categories: {
          communication: { $avg: '$categories.communication' },
          cleanliness: { $avg: '$categories.cleanliness' },
          accuracy: { $avg: '$categories.accuracy' },
          value: { $avg: '$categories.value' },
          location: { $avg: '$categories.location' }
        }
      }
    },
    {
      $addFields: {
        ratingCounts: {
          5: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 5] } } } },
          4: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 4] } } } },
          3: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 3] } } } },
          2: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 2] } } } },
          1: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 1] } } } }
        }
      }
    }
  ]);
};

// Static method to get listing review statistics
reviewSchema.statics.getListingReviewStats = function(listingId) {
  return this.aggregate([
    { $match: { listingId: mongoose.Types.ObjectId(listingId), status: 'active' } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        categories: {
          communication: { $avg: '$categories.communication' },
          cleanliness: { $avg: '$categories.cleanliness' },
          accuracy: { $avg: '$categories.accuracy' },
          value: { $avg: '$categories.value' },
          location: { $avg: '$categories.location' }
        }
      }
    }
  ]);
};

// Pre-save middleware to update timestamps
reviewSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Post-save middleware to update user and listing ratings
reviewSchema.post('save', async function() {
  try {
    // Update reviewee's rating
    const User = require('./User');
    const userStats = await this.constructor.getReviewStats(this.revieweeId);
    
    if (userStats.length > 0) {
      await User.findByIdAndUpdate(this.revieweeId, {
        'rating.average': userStats[0].averageRating || 0,
        'rating.count': userStats[0].totalReviews || 0
      });
    }

    // Update listing rating if applicable
    if (this.listingId) {
      const Listing = require('./Listing');
      const listingStats = await this.constructor.getListingReviewStats(this.listingId);
      
      if (listingStats.length > 0) {
        await Listing.findByIdAndUpdate(this.listingId, {
          'rating.average': listingStats[0].averageRating || 0,
          'rating.count': listingStats[0].totalReviews || 0
        });
      }
    }
  } catch (error) {
    console.error('Error updating ratings after review save:', error);
  }
});

module.exports = mongoose.model('Review', reviewSchema);