const mongoose = require('mongoose');
const slugify = require('slugify');

const listingSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Listing title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  titleUrdu: {
    type: String,
    trim: true,
    maxlength: [200, 'Urdu title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  descriptionUrdu: {
    type: String,
    maxlength: [2000, 'Urdu description cannot exceed 2000 characters']
  },

  // Owner Information
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required']
  },

  // Category Information
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['property', 'vehicles', 'clothes', 'equipment', 'services', 'animals', 'boats', 'air']
  },
  subcategory: {
    type: String,
    required: [true, 'Subcategory is required']
  },

  // Media
  images: [{
    public_id: { type: String, required: true },
    url: { type: String, required: true },
    thumbnailUrl: String,
    order: { type: Number, default: 0 },
    caption: String,
    altText: String
  }],
  videos: [{
    public_id: { type: String, required: true },
    url: { type: String, required: true },
    thumbnailUrl: String,
    duration: Number,
    caption: String
  }],

  // Pricing
  pricing: {
    hourly: {
      type: Number,
      min: [0, 'Hourly rate cannot be negative']
    },
    daily: {
      type: Number,
      min: [0, 'Daily rate cannot be negative']
    },
    weekly: {
      type: Number,
      min: [0, 'Weekly rate cannot be negative']
    },
    monthly: {
      type: Number,
      min: [0, 'Monthly rate cannot be negative']
    },
    currency: {
      type: String,
      enum: ['PKR', 'USD'],
      default: 'PKR'
    }
  },

  // Location
  location: {
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    area: String,
    city: {
      type: String,
      required: [true, 'City is required'],
      enum: ['karachi', 'lahore', 'islamabad', 'rawalpindi', 'faisalabad', 'multan', 'peshawar', 'quetta', 'other']
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    zipCode: String
  },

  // Features and Specifications
  features: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  // Availability and Booking
  availability: {
    instantBook: {
      type: Boolean,
      default: false
    },
    minRentalDuration: {
      type: Number,
      default: 1,
      min: [1, 'Minimum rental duration must be at least 1']
    },
    maxRentalDuration: {
      type: Number,
      default: 365
    },
    availableFrom: Date,
    availableTo: Date,
    blockedDates: [Date],
    timeSlots: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String,
      endTime: String,
      available: { type: Boolean, default: true }
    }]
  },

  // Policies
  policies: {
    cancellation: {
      type: String,
      enum: ['flexible', 'moderate', 'strict', 'non_refundable'],
      default: 'flexible'
    },
    deposit: {
      amount: { type: Number, min: 0 },
      required: { type: Boolean, default: false }
    },
    rules: [String],
    additionalFees: [{
      name: String,
      amount: Number,
      type: { type: String, enum: ['fixed', 'percentage'] },
      description: String
    }]
  },

  // Status and Moderation
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'inactive', 'suspended', 'rejected', 'expired'],
    default: 'pending'
  },
  moderationNotes: String,
  rejectionReason: String,
  suspensionReason: String,

  // Subscription-based expiration
  expiresAt: Date, // When the listing will auto-deactivate
  ownerPlan: {
    type: String,
    enum: ['free', 'basic', 'premium'],
    default: 'free'
  },

  // Statistics
  stats: {
    views: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }
  },

  // Rating and Reviews
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },

  // SEO and Marketing
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  featured: {
    type: Boolean,
    default: false
  },
  featuredUntil: Date,
  promoted: {
    type: Boolean,
    default: false
  },
  promotedUntil: Date,

  // Verification
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  verificationBadges: [{
    type: String,
    enum: ['quality_checked', 'owner_verified', 'popular', 'new_listing']
  }],

  // Timestamps
  publishedAt: Date,
  lastModified: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
listingSchema.index({ owner: 1 });
listingSchema.index({ category: 1, subcategory: 1 });
listingSchema.index({ 'location.coordinates': '2dsphere' });
listingSchema.index({ 'location.city': 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ featured: 1 });
listingSchema.index({ 'rating.average': -1 });
listingSchema.index({ 'stats.views': -1 });
listingSchema.index({ createdAt: -1 });
listingSchema.index({ publishedAt: -1 });
listingSchema.index({ slug: 1 });

// Text index for search functionality
listingSchema.index({
  title: 'text',
  titleUrdu: 'text',
  description: 'text',
  descriptionUrdu: 'text',
  features: 'text',
  'location.address': 'text',
  'location.area': 'text'
});

// Compound indexes for common queries
listingSchema.index({ category: 1, 'location.city': 1, status: 1 });
listingSchema.index({ status: 1, featured: 1, createdAt: -1 });

// Virtual for minimum price
listingSchema.virtual('minPrice').get(function() {
  const prices = [this.pricing.hourly, this.pricing.daily, this.pricing.weekly, this.pricing.monthly]
    .filter(price => price && price > 0);
  return prices.length > 0 ? Math.min(...prices) : 0;
});

// Virtual for price per day (for comparison)
listingSchema.virtual('pricePerDay').get(function() {
  if (this.pricing.daily) return this.pricing.daily;
  if (this.pricing.hourly) return this.pricing.hourly * 24;
  if (this.pricing.weekly) return this.pricing.weekly / 7;
  if (this.pricing.monthly) return this.pricing.monthly / 30;
  return 0;
});

// Virtual for availability status
listingSchema.virtual('isAvailable').get(function() {
  if (this.status !== 'active') return false;
  if (this.availability.availableTo && this.availability.availableTo < new Date()) return false;
  return true;
});

// Virtual for image count
listingSchema.virtual('imageCount').get(function() {
  return this.images ? this.images.length : 0;
});

// Pre-save middleware to generate slug
listingSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + this._id.toString().slice(-6);
  }
  next();
});

// Pre-save middleware to update lastModified
listingSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModified = new Date();
  }
  next();
});

// Pre-save middleware to set publishedAt when status changes to active
listingSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Method to increment view count
listingSchema.methods.incrementViews = function() {
  this.stats.views += 1;
  return this.save({ validateBeforeSave: false });
};

// Method to add to favorites
listingSchema.methods.addToFavorites = function() {
  this.stats.favorites += 1;
  return this.save({ validateBeforeSave: false });
};

// Method to remove from favorites
listingSchema.methods.removeFromFavorites = function() {
  this.stats.favorites = Math.max(0, this.stats.favorites - 1);
  return this.save({ validateBeforeSave: false });
};

// Method to increment inquiries
listingSchema.methods.incrementInquiries = function() {
  this.stats.inquiries += 1;
  return this.save({ validateBeforeSave: false });
};

// Method to check if date is available
listingSchema.methods.isDateAvailable = function(date) {
  if (!this.isAvailable) return false;
  
  const checkDate = new Date(date);
  
  // Check if date is in blocked dates
  if (this.availability.blockedDates) {
    const isBlocked = this.availability.blockedDates.some(blockedDate => 
      blockedDate.toDateString() === checkDate.toDateString()
    );
    if (isBlocked) return false;
  }
  
  // Check availability window
  if (this.availability.availableFrom && checkDate < this.availability.availableFrom) return false;
  if (this.availability.availableTo && checkDate > this.availability.availableTo) return false;
  
  return true;
};

// Method to block dates
listingSchema.methods.blockDates = function(dates) {
  if (!this.availability.blockedDates) {
    this.availability.blockedDates = [];
  }
  
  dates.forEach(date => {
    const dateObj = new Date(date);
    const exists = this.availability.blockedDates.some(blockedDate => 
      blockedDate.toDateString() === dateObj.toDateString()
    );
    if (!exists) {
      this.availability.blockedDates.push(dateObj);
    }
  });
  
  return this.save();
};

// Method to unblock dates
listingSchema.methods.unblockDates = function(dates) {
  if (!this.availability.blockedDates) return this.save();
  
  dates.forEach(date => {
    const dateObj = new Date(date);
    this.availability.blockedDates = this.availability.blockedDates.filter(blockedDate => 
      blockedDate.toDateString() !== dateObj.toDateString()
    );
  });
  
  return this.save();
};

// Method to calculate price for date range
listingSchema.methods.calculatePrice = function(startDate, endDate, priceType = 'daily') {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  let unitPrice = 0;
  let duration = days;
  
  switch (priceType) {
    case 'hourly':
      unitPrice = this.pricing.hourly || 0;
      duration = days * 24; // Convert to hours
      break;
    case 'weekly':
      unitPrice = this.pricing.weekly || 0;
      duration = Math.ceil(days / 7); // Convert to weeks
      break;
    case 'monthly':
      unitPrice = this.pricing.monthly || 0;
      duration = Math.ceil(days / 30); // Convert to months
      break;
    default: // daily
      unitPrice = this.pricing.daily || 0;
      duration = days;
  }
  
  const subtotal = unitPrice * duration;
  const serviceFee = Math.round(subtotal * 0.05); // 5% service fee
  const total = subtotal + serviceFee;
  
  return {
    unitPrice,
    duration,
    subtotal,
    serviceFee,
    total,
    deposit: this.policies.deposit.amount || 0
  };
};

// Static method to find nearby listings
listingSchema.statics.findNearby = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    status: 'active'
  });
};

// Static method for advanced search
listingSchema.statics.advancedSearch = function(filters) {
  const query = { status: 'active' };
  
  // Text search
  if (filters.q) {
    query.$text = { $search: filters.q };
  }
  
  // Category filter
  if (filters.category) {
    query.category = filters.category;
  }
  
  // Subcategory filter
  if (filters.subcategory) {
    query.subcategory = filters.subcategory;
  }
  
  // City filter
  if (filters.city) {
    query['location.city'] = filters.city;
  }
  
  // Price range filter
  if (filters.minPrice || filters.maxPrice) {
    const priceField = filters.priceType === 'hourly' ? 'pricing.hourly' :
                      filters.priceType === 'weekly' ? 'pricing.weekly' :
                      filters.priceType === 'monthly' ? 'pricing.monthly' :
                      'pricing.daily';
    
    query[priceField] = {};
    if (filters.minPrice) query[priceField].$gte = parseInt(filters.minPrice);
    if (filters.maxPrice) query[priceField].$lte = parseInt(filters.maxPrice);
  }
  
  // Features filter
  if (filters.features && filters.features.length > 0) {
    query.features = { $in: filters.features };
  }
  
  // Instant book filter
  if (filters.instantBook === 'true') {
    query['availability.instantBook'] = true;
  }
  
  // Verified filter
  if (filters.verified === 'true') {
    query.verified = true;
  }
  
  // Rating filter
  if (filters.minRating) {
    query['rating.average'] = { $gte: parseFloat(filters.minRating) };
  }
  
  // Location-based search
  if (filters.lat && filters.lng) {
    const maxDistance = filters.radius ? parseInt(filters.radius) * 1000 : 10000; // Convert km to meters
    query['location.coordinates'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(filters.lng), parseFloat(filters.lat)]
        },
        $maxDistance: maxDistance
      }
    };
  }
  
  return this.find(query);
};

module.exports = mongoose.model('Listing', listingSchema);