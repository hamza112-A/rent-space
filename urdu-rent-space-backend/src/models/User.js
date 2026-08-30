const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Basic Information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^\+92[0-9]{10}$/, 'Please enter a valid Pakistani phone number (+92xxxxxxxxxx)']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },

  // Profile Information
  avatar: {
    public_id: String,
    url: String
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  languages: [{
    type: String,
    enum: ['urdu', 'english', 'punjabi', 'sindhi', 'pashto', 'balochi', 'other']
  }],

  // Role and Permissions
  role: {
    type: String,
    enum: ['owner', 'borrower', 'both'],
    required: [true, 'User role is required']
  },
  accountType: {
    type: String,
    enum: ['individual', 'business'],
    default: 'individual'
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isSuperAdmin: {
    type: Boolean,
    default: false
  },
  // Granular admin role (see docs/redesign/11-admin-panel.md) — source of
  // truth for what an admin can do; isAdmin/isSuperAdmin above are kept in
  // sync (via pre-save hook below) purely for existing code that checks
  // those booleans directly, so neither needs a wholesale rewrite.
  // 'support': verifications, disputes, listings moderation, reports — no
  //   financial actions.
  // 'finance': payouts and revenue analytics — not user/listing moderation.
  // 'superadmin': everything, including managing other admins' roles.
  adminRole: {
    type: String,
    enum: ['none', 'support', 'finance', 'superadmin'],
    default: 'none'
  },

  // Verification Status
  verification: {
    email: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      token: String,
      tokenExpires: Date,
      attempts: { type: Number, default: 0 },
      lastSentAt: Date
    },
    phone: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      otp: String,
      otpExpires: Date,
      attempts: { type: Number, default: 0 },
      lastSentAt: Date
    },
    identity: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'not_submitted'],
        default: 'not_submitted'
      },
      documentType: {
        type: String,
        enum: ['cnic', 'passport', 'driving_license']
      },
      documentNumber: String,
      documents: [{
        type: { type: String, enum: ['front', 'back'] },
        public_id: String,
        url: String
      }],
      rejectionReason: String
    },
    biometric: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'not_submitted'],
        default: 'not_submitted'
      },
      selfieImage: {
        public_id: String,
        url: String
      },
      livenessVideo: {
        public_id: String,
        url: String
      },
      rejectionReason: String
    }
  },

  // Location Information
  location: {
    address: String,
    city: {
      type: String,
      enum: ['karachi', 'lahore', 'islamabad', 'rawalpindi', 'faisalabad', 'multan', 'peshawar', 'quetta', 'other']
    },
    area: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },

  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  }],

  // Basic marketplace-safety controls, surfaced from the Messages tab — see
  // docs/redesign/06-messages.md.
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reports: [{
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    description: String,
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    dismissed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],

  // Subscription Information
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'plus', 'pro', 'business'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active'
    },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    autoRenew: { type: Boolean, default: false },
    paymentMethod: String,
    // Plan limits
    maxListings: { type: Number, default: 3 },
    listingDuration: { type: Number, default: 720 }, // hours; see config/subscriptionPlans.js for per-tier values
    // Commission the platform takes on this owner's completed bookings —
    // the primary upgrade lever, see docs/redesign/01-business-model.md.
    // Kept on the user (not looked up live from the plan) so a booking's
    // rate is locked to whatever the owner's tier was when it was made.
    commissionRate: { type: Number, default: 0.10 },
    featuredCredits: {
      total: { type: Number, default: 0 },
      used: { type: Number, default: 0 },
      resetAt: Date
    },
    features: {
      prioritySupport: { type: Boolean, default: false },
      enhancedVisibility: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      featuredBadge: { type: Boolean, default: false },
      topVisibility: { type: Boolean, default: false },
      storefront: { type: Boolean, default: false },
      teamAccounts: { type: Boolean, default: false }
    }
  },

  // Business-tier multi-user team membership. Set on the billing owner too
  // (role: 'owner') so any user with `organization.id` can be resolved to
  // the same shared listing pool — see models/Organization.js and
  // docs/redesign/02-subscription-tiers.md.
  organization: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    role: { type: String, enum: ['owner', 'admin', 'staff'] }
  },

  // Pro/Business storefront/brand page — a public profile grouping an
  // owner's listings under one branded page. Gated on
  // subscription.features.storefront; see docs/redesign/02-subscription-tiers.md.
  storefront: {
    enabled: { type: Boolean, default: false },
    slug: { type: String, lowercase: true, trim: true },
    name: { type: String, trim: true, maxlength: 100 },
    tagline: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    logoUrl: String,
    bannerUrl: String
  },

  // Payment Methods
  paymentMethods: [{
    type: {
      type: String,
      enum: ['jazzcash', 'easypaisa', 'card', 'bank'],
      required: true
    },
    details: {
      // For mobile wallets (JazzCash, Easypaisa)
      mobileNumber: String,
      accountTitle: String,
      // For cards
      cardNumber: String, // Masked: ****1234
      cardName: String,
      expiryMonth: String,
      expiryYear: String,
      cardBrand: String, // visa, mastercard
      // For bank accounts
      bankName: String,
      accountNumber: String, // Masked
      branchCode: String
    },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],

  // Payout Methods — where an owner's earnings are sent. Kept separate from
  // paymentMethods above: that's how a user pays as a borrower, this is how
  // they get paid as an owner, and the two shouldn't be conflated.
  payoutMethods: [{
    type: {
      type: String,
      enum: ['bank_transfer', 'jazzcash', 'easypaisa'],
      required: true
    },
    details: {
      // For mobile wallets (JazzCash, Easypaisa)
      mobileNumber: String,
      accountTitle: String,
      // For bank accounts
      bankName: String,
      accountNumber: String, // Masked: ****1234
      branchCode: String
    },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],

  // Stripe Connect (Express) account for automated payouts. Note: Pakistan is
  // not a Stripe Connect-supported country today, so in production this stays
  // unset for PK-based owners and payoutMethods above is the real payout
  // rail. This exists so the payout flow has a working automated path to
  // develop/demo against in Stripe test mode.
  stripeConnect: {
    accountId: String,
    country: String,
    detailsSubmitted: { type: Boolean, default: false },
    payoutsEnabled: { type: Boolean, default: false },
    chargesEnabled: { type: Boolean, default: false },
    updatedAt: Date
  },

  // Statistics and Ratings
  stats: {
    totalListings: { type: Number, default: 0 },
    activeListings: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 }
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  responseRate: { type: Number, default: 0, min: 0, max: 100 },
  responseTime: {
    type: String,
    enum: ['within_hour', 'within_few_hours', 'within_day', 'few_days'],
    default: 'within_day'
  },

  // Preferences and Settings
  preferences: {
    language: { type: String, enum: ['en', 'ur'], default: 'en' },
    currency: { type: String, enum: ['PKR', 'USD', 'pkr', 'usd'], default: 'PKR' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    privacy: {
      showPhone: { type: Boolean, default: true },
      showEmail: { type: Boolean, default: false },
      showLocation: { type: Boolean, default: true }
    }
  },

  // Security
  twoFactorAuth: {
    enabled: { type: Boolean, default: false },
    secret: { type: String, select: false },
    backupCodes: [{ 
      code: String, 
      used: { type: Boolean, default: false } 
    }],
    enabledAt: Date
  },
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
    deviceInfo: String
  }],
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  lastLogin: Date,
  lastActive: Date,

  // Account Status
  status: {
    type: String,
    // 'deactivated' is user-initiated and reversible (auto-reactivates on
    // next successful login) — distinct from admin-initiated 'suspended'/
    // 'banned'. See docs/redesign/10-settings.md.
    enum: ['active', 'deactivated', 'suspended', 'banned', 'deleted'],
    default: 'active'
  },
  suspensionReason: String,
  suspensionExpires: Date,

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ 'verification.email.verified': 1 });
userSchema.index({ 'verification.phone.verified': 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'storefront.slug': 1 }, { unique: true, sparse: true });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for full verification status (all verifications complete)
userSchema.virtual('isFullyVerified').get(function() {
  return this.verification.email.verified && 
         this.verification.phone.verified && 
         this.verification.identity.verified &&
         this.verification.biometric.verified;
});

// Virtual for basic verification status (any one verification complete)
userSchema.virtual('isVerified').get(function() {
  return this.verification.email.verified || 
         this.verification.phone.verified || 
         this.verification.identity.verified ||
         this.verification.biometric.verified;
});

// Virtual for verification level
userSchema.virtual('verificationLevel').get(function() {
  let level = 0;
  if (this.verification.email.verified) level++;
  if (this.verification.phone.verified) level++;
  if (this.verification.identity.verified) level++;
  if (this.verification.biometric.verified) level++;
  
  if (level === 4) return 'Fully Verified';
  if (level >= 2) return 'Verified';
  if (level === 1) return 'Basic';
  return 'Unverified';
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update passwordChangedAt
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after password change
  next();
});

// Pre-save middleware to keep isAdmin/isSuperAdmin in sync with adminRole,
// whichever side was actually changed — lets old code that only knows about
// the booleans keep working while adminRole is the real source of truth.
userSchema.pre('save', function(next) {
  if (this.isModified('adminRole')) {
    this.isSuperAdmin = this.adminRole === 'superadmin';
    this.isAdmin = this.adminRole !== 'none';
  } else if ((this.isModified('isAdmin') || this.isModified('isSuperAdmin')) && !this.isModified('adminRole')) {
    if (this.isSuperAdmin) this.adminRole = 'superadmin';
    else if (this.isAdmin) this.adminRole = this.adminRole === 'none' ? 'support' : this.adminRole;
    else this.adminRole = 'none';
  }
  next();
});

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role,
      isAdmin: this.isAdmin
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  const refreshToken = jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  // Add refresh token to user's refreshTokens array
  this.refreshTokens.push({
    token: refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    deviceInfo: 'Unknown Device' // This should be populated from request headers
  });

  return refreshToken;
};

// Method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Method to handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to update last active timestamp
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('User', userSchema);