const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const Listing = require('../models/Listing');
const asyncHandler = require('../middleware/asyncHandler');
const { upload } = require('../middleware/upload');

// @route   GET /api/v1/listings
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { category, city, minPrice, maxPrice, search, sort, page = 1, limit = 10 } = req.query;
  
  const query = { status: 'active' };
  
  if (category) query.category = category;
  if (city) query['location.city'] = new RegExp(city, 'i');
  if (minPrice || maxPrice) {
    query['pricing.basePrice'] = {};
    if (minPrice) query['pricing.basePrice'].$gte = Number(minPrice);
    if (maxPrice) query['pricing.basePrice'].$lte = Number(maxPrice);
  }
  if (search) {
    query.$or = [
      { title: new RegExp(search, 'i') },
      { 'title_ur': new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') }
    ];
  }

  const sortOptions = {
    'newest': { createdAt: -1 },
    'price_low': { 'pricing.basePrice': 1 },
    'price_high': { 'pricing.basePrice': -1 },
    'rating': { averageRating: -1 }
  };

  const listings = await Listing.find(query)
    .populate('owner', 'name avatar verificationLevel')
    .populate('category', 'name name_ur icon')
    .sort(sortOptions[sort] || { createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Listing.countDocuments(query);

  res.json({
    success: true,
    data: listings,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
  });
}));

// @route   GET /api/v1/listings/:id
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate('owner', 'name avatar phone verificationLevel createdAt')
    .populate('category', 'name name_ur icon');
  
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  // Increment views
  listing.views += 1;
  await listing.save();

  res.json({ success: true, data: listing });
}));

// @route   POST /api/v1/listings
router.post('/', protect, upload.array('images', 10), asyncHandler(async (req, res) => {
  req.body.owner = req.user._id;
  
  if (req.files?.length) {
    req.body.images = req.files.map(file => ({
      url: file.path,
      publicId: file.filename
    }));
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
    const newImages = req.files.map(file => ({ url: file.path, publicId: file.filename }));
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

// @route   GET /api/v1/listings/user/my-listings
router.get('/user/my-listings', protect, asyncHandler(async (req, res) => {
  const listings = await Listing.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: listings });
}));

module.exports = router;
