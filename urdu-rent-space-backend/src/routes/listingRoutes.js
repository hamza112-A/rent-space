const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, optionalAuth, ownerOnly } = require('../middleware/auth');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Payment = require('../models/Payment');
const asyncHandler = require('../middleware/asyncHandler');
const { upload } = require('../middleware/upload');
const { uploadToCloudinary } = require('../services/uploadService');
const { getSafetyGuidelinesForCategory, getDefaultDisclaimers } = require('../utils/safetyGuidelines');
const { escapeRegex } = require('../utils/validation');
const { parseCsv } = require('../utils/csv');
const { FEATURED_BOOST } = require('../config/subscriptionPlans');
const Organization = require('../models/Organization');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Business-tier team members act on the organization owner's listing pool
// instead of their own — see models/Organization.js and "Multi-user team
// accounts" in docs/redesign/02-subscription-tiers.md. A staff/admin member
// creating a listing has it owned by the billing owner (so it counts
// against/benefits from the owner's plan) with `createdBy` recording who
// actually made it.
const resolveEffectiveOwner = async (actingUser) => {
  if (!actingUser.organization?.id) {
    return { ownerId: actingUser._id, createdBy: undefined, billingUser: actingUser };
  }
  const org = await Organization.findById(actingUser.organization.id);
  if (!org || org.owner.toString() === actingUser._id.toString()) {
    return { ownerId: actingUser._id, createdBy: undefined, billingUser: actingUser };
  }
  const billingUser = await User.findById(org.owner);
  return { ownerId: org.owner, createdBy: actingUser._id, billingUser };
};

const canManageListing = async (user, listing) => {
  if (listing.owner.toString() === user._id.toString()) return true;
  if (user.isAdmin || user.isSuperAdmin) return true;
  if (user.organization?.id) {
    const org = await Organization.findById(user.organization.id);
    if (org && org.owner.toString() === listing.owner.toString()) return true;
  }
  return false;
};

// CSV bulk listing upload (Business tier only) — separate multer instance
// since the shared `upload` middleware's fileFilter only allows image/video
// mimetypes.
const bulkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isCsv = file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.toLowerCase().endsWith('.csv');
    cb(isCsv ? null : new Error('Only CSV files are supported'), isCsv);
  }
});

const BULK_UPLOAD_COLUMNS = [
  'title', 'titleUrdu', 'description', 'descriptionUrdu', 'category', 'subcategory',
  'city', 'area', 'address', 'pricingDaily', 'pricingHourly', 'pricingWeekly',
  'pricingMonthly', 'features', 'imageUrls'
];
const BULK_UPLOAD_REQUIRED_COLUMNS = ['title', 'description', 'category', 'subcategory', 'city', 'address'];

// Extends a listing's featured placement by FEATURED_BOOST.days from whichever
// is later: now, or its current featuredUntil (so stacking a boost on an
// already-boosted listing extends it rather than wasting the overlap).
const applyFeaturedBoost = async (listing) => {
  const now = new Date();
  const base = listing.featuredUntil && listing.featuredUntil > now ? listing.featuredUntil : now;
  const featuredUntil = new Date(base);
  featuredUntil.setDate(featuredUntil.getDate() + FEATURED_BOOST.days);

  listing.featured = true;
  listing.featuredUntil = featuredUntil;
  await listing.save();
  return listing;
};

// @route   POST /api/v1/listings/:id/favorite
// @desc    Toggle the current user's favorite/saved status for a listing
// @access  Private
router.post('/:id/favorite', protect, asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  const user = await User.findById(req.user._id);
  const idx = user.favorites.findIndex((id) => id.toString() === listing._id.toString());
  let favorited;
  if (idx === -1) {
    user.favorites.push(listing._id);
    listing.stats.favorites += 1;
    favorited = true;
  } else {
    user.favorites.splice(idx, 1);
    listing.stats.favorites = Math.max(0, listing.stats.favorites - 1);
    favorited = false;
  }
  await Promise.all([
    user.save({ validateBeforeSave: false }),
    listing.save({ validateBeforeSave: false })
  ]);

  res.json({ success: true, data: { favorited } });
}));

// @route   GET /api/v1/listings/favorites (MUST be before /:id)
// @desc    Get the current user's saved/favorited listings
// @access  Private
router.get('/favorites', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'favorites',
    select: 'title images pricing location status featured stats createdAt'
  });
  res.json({ success: true, data: user.favorites || [] });
}));

// @route   PUT /api/v1/listings/:id/renew (MUST be before /:id)
// @desc    Extend an expiring/expired listing's expiresAt by the owner's
//          current plan listing duration — the one-click renew from
//          docs/redesign/04-my-listings.md's expiry warning.
// @access  Private (owner of the listing)
router.put('/:id/renew', protect, ownerOnly, asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }
  if (!(await canManageListing(req.user, listing))) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const owner = await User.findById(listing.owner);
  const listingDuration = owner.subscription?.listingDuration ?? 720;

  if (listingDuration !== -1) {
    const base = listing.expiresAt && listing.expiresAt > new Date() ? listing.expiresAt : new Date();
    const newExpiry = new Date(base);
    newExpiry.setHours(newExpiry.getHours() + listingDuration);
    listing.expiresAt = newExpiry;
  } else {
    listing.expiresAt = null;
  }

  if (listing.status === 'expired') {
    listing.status = 'active';
  }
  await listing.save();

  res.json({ success: true, data: listing });
}));

// @route   GET /api/v1/listings/safety-guidelines/:category
// @desc    Get category-specific safety guidelines templates
// @access  Public
router.get('/safety-guidelines/:category', asyncHandler(async (req, res) => {
  const { category } = req.params;
  
  const guidelines = getSafetyGuidelinesForCategory(category);
  const disclaimers = getDefaultDisclaimers(category);
  
  res.json({
    success: true,
    data: {
      safetyGuidelines: {
        categorySpecific: guidelines
      },
      disclaimers
    }
  });
}));

// @route   GET /api/v1/listings/user/my-listings (MUST be before /:id)
// Only owners can have listings
router.get('/user/my-listings', protect, ownerOnly, asyncHandler(async (req, res) => {
  const actingUser = await User.findById(req.user._id);
  const { ownerId } = await resolveEffectiveOwner(actingUser);
  const listings = await Listing.find({ owner: ownerId }).sort({ createdAt: -1 });
  res.json({ success: true, data: listings });
}));

// @route   GET /api/v1/listings
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { category, subcategory, city, location, minPrice, maxPrice, verified, instantBook, minRating, search, query, sort, page = 1, limit = 10 } = req.query;
  
  // Lazily clear expired boosts so `featured` stays accurate without a cron
  // job — same lazy-sync pattern used for subscription plan details.
  await Listing.updateMany(
    { featured: true, featuredUntil: { $lt: new Date() } },
    { $set: { featured: false } }
  );

  const dbQuery = { status: 'active' };

  if (category) dbQuery.category = category;
  if (subcategory) dbQuery.subcategory = subcategory;
  if (verified === 'true') dbQuery.verified = true;
  if (instantBook === 'true') dbQuery['availability.instantBook'] = true;
  if (minRating) dbQuery['rating.average'] = { $gte: Number(minRating) };

  // Handle location search (city or area)
  if (city || location) {
    const locationSearch = escapeRegex(city || location);
    dbQuery.$or = dbQuery.$or || [];
    dbQuery.$or.push(
      { 'location.city': new RegExp(locationSearch, 'i') },
      { 'location.area': new RegExp(locationSearch, 'i') }
    );
  }
  
  if (minPrice || maxPrice) {
    dbQuery['pricing.daily'] = {};
    if (minPrice) dbQuery['pricing.daily'].$gte = Number(minPrice);
    if (maxPrice) dbQuery['pricing.daily'].$lte = Number(maxPrice);
  }
  
  // Handle search query (supports both 'search' and 'query' params)
  const searchTerm = escapeRegex(search || query);
  if (searchTerm) {
    const searchConditions = [
      { title: new RegExp(searchTerm, 'i') },
      { titleUrdu: new RegExp(searchTerm, 'i') },
      { description: new RegExp(searchTerm, 'i') }
    ];
    
    if (dbQuery.$or) {
      // If we already have $or conditions (from location), use $and to combine
      dbQuery.$and = [
        { $or: dbQuery.$or },
        { $or: searchConditions }
      ];
      delete dbQuery.$or;
    } else {
      dbQuery.$or = searchConditions;
    }
  }

  // Featured listings (active boosts, from tier credits or a la carte
  // purchase — see docs/redesign/01-business-model.md) always rank first,
  // then the requested sort breaks ties within each group.
  const sortOptions = {
    'newest': { featured: -1, createdAt: -1 },
    'price_low': { featured: -1, 'pricing.daily': 1 },
    'price_high': { featured: -1, 'pricing.daily': -1 },
    'rating': { featured: -1, 'rating.average': -1 }
  };

  const listings = await Listing.find(dbQuery)
    .populate('owner', 'fullName profileImage verificationLevel')
    .sort(sortOptions[sort] || sortOptions.newest)
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Listing.countDocuments(dbQuery);

  res.json({
    success: true,
    data: listings,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
  });
}));

// @route   GET /api/v1/listings/:id
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate({
      path: 'owner',
      select: 'fullName profileImage phone createdAt verification role',
    });
  
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  // Increment views
  listing.stats.views += 1;
  await listing.save({ validateBeforeSave: false });

  // Convert to object to include virtuals and add computed fields
  const listingObj = listing.toObject();
  
  // Add owner verification info
  if (listingObj.owner) {
    const owner = listingObj.owner;
    const verification = owner.verification || {};
    
    // Calculate verification level
    let level = 0;
    if (verification.email?.verified) level++;
    if (verification.phone?.verified) level++;
    if (verification.identity?.verified) level++;
    if (verification.biometric?.verified) level++;
    
    owner.verificationLevel = level === 4 ? 'Fully Verified' : 
                              level >= 2 ? 'Verified' : 
                              level === 1 ? 'Basic' : 'Unverified';
    owner.isEmailVerified = verification.email?.verified || false;
    owner.isPhoneVerified = verification.phone?.verified || false;
    
    // Remove sensitive verification details
    delete owner.verification;
  }

  res.json({ success: true, data: listingObj });
}));

// @route   POST /api/v1/listings
// Only owners can create listings
router.post('/', protect, ownerOnly, upload.array('images', 10), asyncHandler(async (req, res) => {

  // Get user's subscription info — Business-tier team members share the
  // organization owner's plan and listing pool (see resolveEffectiveOwner).
  const actingUser = await User.findById(req.user._id);
  const { ownerId, createdBy, billingUser } = await resolveEffectiveOwner(actingUser);
  const subscription = billingUser.subscription;

  // Check listing limits
  const activeListings = await Listing.countDocuments({
    owner: ownerId,
    status: { $in: ['active', 'pending'] }
  });

  const maxListings = subscription.maxListings || 5;
  if (maxListings !== -1 && activeListings >= maxListings) {
    return res.status(403).json({
      success: false,
      message: `You have reached your listing limit (${maxListings}). Please upgrade your plan to create more listings.`,
      upgradeRequired: true
    });
  }

  // Parse JSON fields that were stringified in FormData
  const jsonFields = ['location', 'pricing', 'availability', 'policies', 'specifications'];
  jsonFields.forEach(field => {
    if (req.body[field] && typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }
  });

  req.body.owner = ownerId;
  if (createdBy) req.body.createdBy = createdBy;
  req.body.ownerPlan = subscription.plan || 'free';
  
  // Set expiration based on subscription plan
  const listingDuration = subscription.listingDuration || 48; // hours
  if (listingDuration !== -1) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + listingDuration);
    req.body.expiresAt = expiresAt;
  } else {
    req.body.expiresAt = null; // Never expires for premium
  }
  
  // Handle uploaded files - upload to Cloudinary
  if (req.files?.length) {
    const uploadPromises = req.files.map(async (file, index) => {
      try {
        // Try Cloudinary upload
        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
          const result = await uploadToCloudinary(file.buffer, {
            folder: 'listings',
            width: 1200,
            height: 800
          });
          return {
            public_id: result.public_id,
            url: result.secure_url,
            order: index
          };
        } else {
          // Fallback: Convert to base64 data URL (for development without Cloudinary)
          const base64 = file.buffer.toString('base64');
          const dataUrl = `data:${file.mimetype};base64,${base64}`;
          return {
            public_id: `local_${Date.now()}_${index}`,
            url: dataUrl,
            order: index
          };
        }
      } catch (error) {
        console.error('Image upload error:', error);
        // Fallback to base64 on error
        const base64 = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64}`;
        return {
          public_id: `local_${Date.now()}_${index}`,
          url: dataUrl,
          order: index
        };
      }
    });
    
    const uploadedImages = await Promise.all(uploadPromises);
    req.body.images = uploadedImages.filter(img => img !== null);
  }
  
  // Handle mock image URLs from frontend (temporary)
  if (req.body.imageUrls) {
    try {
      const imageUrls = typeof req.body.imageUrls === 'string' 
        ? JSON.parse(req.body.imageUrls) 
        : req.body.imageUrls;
      if (Array.isArray(imageUrls) && imageUrls.length > 0 && !req.body.images?.length) {
        req.body.images = imageUrls.map((url, index) => ({
          public_id: `mock_${Date.now()}_${index}`,
          url: url,
          order: index
        }));
      }
      delete req.body.imageUrls;
    } catch (e) {
      // Ignore parsing errors
    }
  }

  const listing = await Listing.create(req.body);
  res.status(201).json({ success: true, data: listing });
}));

// @route   PUT /api/v1/listings/:id
router.put('/:id', protect, upload.array('images', 10), asyncHandler(async (req, res) => {
  let listing = await Listing.findById(req.params.id);
  
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  if (!(await canManageListing(req.user, listing))) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  // Parse JSON strings from FormData
  const updateData = {};
  for (const key in req.body) {
    try {
      if (typeof req.body[key] === 'string' && (req.body[key].startsWith('{') || req.body[key].startsWith('['))) {
        updateData[key] = JSON.parse(req.body[key]);
      } else {
        updateData[key] = req.body[key];
      }
    } catch (e) {
      updateData[key] = req.body[key];
    }
  }

  // Handle specifications Map type - convert object to Map
  if (updateData.specifications && typeof updateData.specifications === 'object') {
    listing.specifications = new Map(Object.entries(updateData.specifications));
  }

  if (req.files?.length) {
    const existingCount = listing.images?.length || 0;
    const uploadPromises = req.files.map(async (file, index) => {
      try {
        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
          const result = await uploadToCloudinary(file.buffer, {
            folder: 'listings',
            width: 1200,
            height: 800
          });
          return {
            public_id: result.public_id,
            url: result.secure_url,
            order: existingCount + index
          };
        } else {
          const base64 = file.buffer.toString('base64');
          const dataUrl = `data:${file.mimetype};base64,${base64}`;
          return {
            public_id: `local_${Date.now()}_${index}`,
            url: dataUrl,
            order: existingCount + index
          };
        }
      } catch (error) {
        console.error('Image upload error:', error);
        const base64 = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64}`;
        return {
          public_id: `local_${Date.now()}_${index}`,
          url: dataUrl,
          order: existingCount + index
        };
      }
    });
    
    const uploadedImages = await Promise.all(uploadPromises);
    const newImages = uploadedImages.filter(img => img !== null);
    updateData.images = [...(listing.images || []), ...newImages];
  }

  // Remove specifications from updateData to avoid Map casting error
  const { specifications, ...restData } = updateData;

  // Update listing with proper data
  listing = await Listing.findByIdAndUpdate(req.params.id, restData, { new: true, runValidators: true });
  res.json({ success: true, data: listing });
}));

// @route   DELETE /api/v1/listings/:id
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  if (!(await canManageListing(req.user, listing))) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await listing.deleteOne();
  res.json({ success: true, message: 'Listing deleted' });
}));

// @route   POST /api/v1/listings/:id/feature/use-credit
// @desc    Boost a listing using one of the owner's monthly featured-listing
//          credits (Plus/Pro/Business tiers) — free, no payment involved.
// @access  Private (owner of the listing)
router.post('/:id/feature/use-credit', protect, ownerOnly, asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }
  if (listing.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const user = await User.findById(req.user._id);
  const credits = user.subscription?.featuredCredits;

  // Credits reset monthly on the subscription's billing cycle; check lazily
  // on use, same pattern as the plan-detail sync in subscriptionRoutes.js.
  if (credits?.resetAt && credits.resetAt < new Date()) {
    credits.used = 0;
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1);
    credits.resetAt = nextReset;
  }

  const total = credits?.total || 0;
  const used = credits?.used || 0;
  if (used >= total) {
    return res.status(400).json({
      success: false,
      message: total === 0
        ? 'Your plan has no featured-listing credits. Upgrade your plan or purchase a boost.'
        : 'No featured-listing credits remaining this month. Purchase a boost instead.',
      creditsRemaining: 0
    });
  }

  user.subscription.featuredCredits.used = used + 1;
  await user.save();
  await applyFeaturedBoost(listing);

  res.json({
    success: true,
    message: `Listing featured for ${FEATURED_BOOST.days} days`,
    data: {
      listing,
      creditsRemaining: total - (used + 1)
    }
  });
}));

// @route   POST /api/v1/listings/:id/feature/create-payment
// @desc    Create a Stripe Payment Intent to buy a one-off featured boost
//          (for owners without credits, or who don't want to subscribe).
// @access  Private (owner of the listing)
router.post('/:id/feature/create-payment', protect, ownerOnly, asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }
  if (listing.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: FEATURED_BOOST.price * 100,
    currency: FEATURED_BOOST.currency.toLowerCase(),
    metadata: {
      userId: req.user._id.toString(),
      listingId: listing._id.toString(),
      type: 'featured_boost'
    },
    description: `Featured boost (${FEATURED_BOOST.days} days) for "${listing.title}"`
  });

  const payment = await Payment.create({
    payer: req.user._id,
    listing: listing._id,
    method: 'stripe',
    status: 'pending',
    amount: {
      subtotal: FEATURED_BOOST.price,
      total: FEATURED_BOOST.price,
      currency: FEATURED_BOOST.currency
    },
    stripePaymentIntentId: paymentIntent.id,
    description: `Featured boost (${FEATURED_BOOST.days} days)`
  });

  res.json({
    success: true,
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment._id,
      amount: FEATURED_BOOST.price,
      days: FEATURED_BOOST.days
    }
  });
}));

// @route   POST /api/v1/listings/:id/feature/confirm
// @desc    Confirm a featured-boost payment and activate the boost.
// @access  Private (owner of the listing)
router.post('/:id/feature/confirm', protect, ownerOnly, asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;
  if (!paymentIntentId) {
    return res.status(400).json({ success: false, message: 'Payment Intent ID is required' });
  }

  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }
  if (listing.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const payment = await Payment.findOne({
    stripePaymentIntentId: paymentIntentId,
    payer: req.user._id,
    listing: listing._id
  });
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment record not found' });
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status !== 'succeeded') {
    return res.status(400).json({ success: false, message: `Payment status: ${paymentIntent.status}` });
  }

  if (payment.status !== 'completed') {
    payment.status = 'completed';
    payment.completedAt = new Date();
    payment.transactionId = paymentIntent.id;
    await payment.save();
  }

  await applyFeaturedBoost(listing);

  res.json({
    success: true,
    message: `Listing featured for ${FEATURED_BOOST.days} days`,
    data: { listing }
  });
}));

// @route   GET /api/v1/listings/bulk-upload/template
// @desc    Download a CSV template for the Business-tier bulk listing upload
// @access  Private (owner)
router.get('/bulk-upload/template', protect, ownerOnly, asyncHandler(async (req, res) => {
  const example = [
    'Toyota Corolla 2020', 'ٹویوٹا کرولا 2020',
    'Well-maintained sedan, available for daily rental.', '',
    'vehicles', 'sedan', 'karachi', 'DHA Phase 5', 'Plot 123, DHA Phase 5',
    '5000', '', '30000', '', 'AC;Bluetooth;Automatic',
    'https://example.com/car1.jpg;https://example.com/car2.jpg'
  ];
  const escapeCell = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = `${BULK_UPLOAD_COLUMNS.join(',')}\n${example.map(escapeCell).join(',')}\n`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="listing-bulk-upload-template.csv"');
  res.send(csv);
}));

// @route   POST /api/v1/listings/bulk-upload
// @desc    Bulk-create listings from a CSV file — Business plan only, see
//          "Bulk listing upload" in docs/redesign/02-subscription-tiers.md.
// @access  Private (owner, business plan)
router.post('/bulk-upload', protect, ownerOnly, bulkUpload.single('file'), asyncHandler(async (req, res) => {
  const actingUser = await User.findById(req.user._id);
  const { ownerId, createdBy, billingUser } = await resolveEffectiveOwner(actingUser);
  if (billingUser.subscription?.plan !== 'business') {
    return res.status(403).json({
      success: false,
      message: 'Bulk listing upload is available on the Business plan only.',
      upgradeRequired: true
    });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'CSV file is required' });
  }

  const rows = parseCsv(req.file.buffer.toString('utf-8'));
  if (rows.length < 2) {
    return res.status(400).json({ success: false, message: 'CSV file has no data rows' });
  }

  const [headerRow, ...dataRows] = rows;
  const header = headerRow.map((h) => h.trim());
  const missingColumns = BULK_UPLOAD_REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missingColumns.length) {
    return res.status(400).json({
      success: false,
      message: `CSV is missing required columns: ${missingColumns.join(', ')}`
    });
  }

  const validCategories = Listing.schema.path('category').enumValues;
  const results = { created: 0, errors: [] };

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNumber = i + 2; // +1 for the header row, +1 for 1-indexing
    if (row.every((cell) => !cell?.trim())) continue;

    const record = {};
    header.forEach((col, idx) => { record[col] = (row[idx] || '').trim(); });

    const rowErrors = [];
    BULK_UPLOAD_REQUIRED_COLUMNS.forEach((col) => {
      if (!record[col]) rowErrors.push(`${col} is required`);
    });
    if (record.category && !validCategories.includes(record.category)) {
      rowErrors.push(`category "${record.category}" is invalid (must be one of: ${validCategories.join(', ')})`);
    }

    const pricing = {
      hourly: parseFloat(record.pricingHourly),
      daily: parseFloat(record.pricingDaily),
      weekly: parseFloat(record.pricingWeekly),
      monthly: parseFloat(record.pricingMonthly)
    };
    if (!Object.values(pricing).some((v) => !isNaN(v) && v > 0)) {
      rowErrors.push('at least one of pricingHourly/pricingDaily/pricingWeekly/pricingMonthly is required');
    }
    Object.keys(pricing).forEach((key) => {
      if (isNaN(pricing[key]) || pricing[key] <= 0) delete pricing[key];
    });

    if (rowErrors.length) {
      results.errors.push({ row: rowNumber, title: record.title || '(untitled)', errors: rowErrors });
      continue;
    }

    const features = (record.features || '').split(';').map((f) => f.trim()).filter(Boolean);
    const imageUrls = (record.imageUrls || '').split(';').map((u) => u.trim()).filter(Boolean);

    try {
      await Listing.create({
        title: record.title,
        titleUrdu: record.titleUrdu || undefined,
        description: record.description,
        descriptionUrdu: record.descriptionUrdu || undefined,
        owner: ownerId,
        createdBy,
        ownerPlan: 'business',
        category: record.category,
        subcategory: record.subcategory,
        location: { address: record.address, area: record.area || undefined, city: record.city },
        pricing,
        features,
        images: imageUrls.map((url, idx) => ({ public_id: `bulk_${Date.now()}_${i}_${idx}`, url, order: idx })),
        safetyGuidelines: { categorySpecific: getSafetyGuidelinesForCategory(record.category) },
        disclaimers: getDefaultDisclaimers(record.category),
        status: 'pending',
        expiresAt: null // Business plan listings never expire
      });
      results.created++;
    } catch (err) {
      results.errors.push({ row: rowNumber, title: record.title, errors: [err.message] });
    }
  }

  res.json({ success: true, data: results });
}));

// @route   GET /api/v1/listings/:id/reviews
// @desc    Get reviews for a listing
// @access  Public
router.get('/:id/reviews', optionalAuth, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = 'newest' } = req.query;
  const Review = require('../models/Review');
  
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  // Sort options
  const sortOptions = {
    'newest': { createdAt: -1 },
    'oldest': { createdAt: 1 },
    'highest': { rating: -1 },
    'lowest': { rating: 1 },
    'helpful': { 'helpfulVotes.count': -1 }
  };

  const query = { 
    listingId: req.params.id,
    status: 'active'
  };

  const reviews = await Review.find(query)
    .populate('reviewerId', 'fullName profileImage')
    .sort(sortOptions[sort] || sortOptions['newest'])
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Review.countDocuments(query);

  res.json({
    success: true,
    data: reviews,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

module.exports = router;
