const express = require('express');
const router = express.Router();
const { protect, optionalAuth, ownerOnly } = require('../middleware/auth');
const Listing = require('../models/Listing');
const asyncHandler = require('../middleware/asyncHandler');
const { upload } = require('../middleware/upload');
const { uploadToCloudinary } = require('../services/uploadService');

// @route   GET /api/v1/listings/user/my-listings (MUST be before /:id)
// Only owners can have listings
router.get('/user/my-listings', protect, ownerOnly, asyncHandler(async (req, res) => {
  const listings = await Listing.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: listings });
}));

// @route   GET /api/v1/listings
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { category, city, location, minPrice, maxPrice, search, query, sort, page = 1, limit = 10 } = req.query;
  
  const dbQuery = { status: 'active' };
  
  if (category) dbQuery.category = category;
  
  // Handle location search (city or area)
  if (city || location) {
    const locationSearch = city || location;
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
  const searchTerm = search || query;
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

  const sortOptions = {
    'newest': { createdAt: -1 },
    'price_low': { 'pricing.daily': 1 },
    'price_high': { 'pricing.daily': -1 },
    'rating': { 'rating.average': -1 }
  };

  const listings = await Listing.find(dbQuery)
    .populate('owner', 'fullName profileImage verificationLevel')
    .sort(sortOptions[sort] || { createdAt: -1 })
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
  const User = require('../models/User');
  
  // Get user's subscription info
  const user = await User.findById(req.user._id);
  const subscription = user.subscription;
  
  // Check listing limits
  const activeListings = await Listing.countDocuments({ 
    owner: req.user._id, 
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

  req.body.owner = req.user._id;
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

  if (listing.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
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
    req.body.images = [...(listing.images || []), ...newImages];
  }

  listing = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data: listing });
}));

// @route   DELETE /api/v1/listings/:id
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  if (listing.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await listing.deleteOne();
  res.json({ success: true, message: 'Listing deleted' });
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
