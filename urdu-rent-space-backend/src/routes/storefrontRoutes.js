const express = require('express');
const router = express.Router();
const slugify = require('slugify');
const { protect, ownerOnly } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const Listing = require('../models/Listing');

// Pro and Business tiers both get the storefront/brand page — see
// "Storefront/brand page" in docs/redesign/02-subscription-tiers.md. Checked
// against the live plan id rather than the cached features blob, same
// pattern as the business-plan gate on listing bulk upload.
const STOREFRONT_PLANS = ['pro', 'business'];
const isStorefrontEligible = (user) => STOREFRONT_PLANS.includes(user.subscription?.plan);

// @route   GET /api/v1/storefront/me/settings
// @desc    Get the current owner's storefront config + eligibility
// @access  Private (owner)
router.get('/me/settings', protect, ownerOnly, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({
    success: true,
    data: { storefront: user.storefront, eligible: isStorefrontEligible(user) }
  });
}));

// @route   PUT /api/v1/storefront
// @desc    Create or update the current owner's storefront page
// @access  Private (owner, Pro/Business plan)
router.put('/', protect, ownerOnly, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!isStorefrontEligible(user)) {
    return res.status(403).json({
      success: false,
      message: 'Storefront pages are available on Pro and Business plans.',
      upgradeRequired: true
    });
  }

  const { name, tagline, description, logoUrl, bannerUrl, enabled } = req.body;
  let { slug } = req.body;

  if (slug) {
    slug = slugify(slug, { lower: true, strict: true });
    if (!slug) {
      return res.status(400).json({ success: false, message: 'Invalid storefront URL' });
    }
    const existing = await User.findOne({ 'storefront.slug': slug, _id: { $ne: user._id } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'That storefront URL is already taken' });
    }
  } else if (!user.storefront?.slug) {
    slug = slugify(`${user.fullName}-${user._id.toString().slice(-6)}`, { lower: true, strict: true });
  }

  user.storefront = {
    ...(user.storefront?.toObject ? user.storefront.toObject() : user.storefront),
    ...(slug && { slug }),
    ...(name !== undefined && { name }),
    ...(tagline !== undefined && { tagline }),
    ...(description !== undefined && { description }),
    ...(logoUrl !== undefined && { logoUrl }),
    ...(bannerUrl !== undefined && { bannerUrl }),
    ...(enabled !== undefined && { enabled })
  };

  await user.save();
  res.json({ success: true, data: user.storefront });
}));

// @route   GET /api/v1/storefront/:slug
// @desc    Public storefront page — owner branding + their active listings
// @access  Public
router.get('/:slug', asyncHandler(async (req, res) => {
  const owner = await User.findOne({ 'storefront.slug': req.params.slug, 'storefront.enabled': true })
    .select('fullName avatar storefront rating createdAt');

  if (!owner) {
    return res.status(404).json({ success: false, message: 'Storefront not found' });
  }

  const listings = await Listing.find({ owner: owner._id, status: 'active' })
    .sort({ featured: -1, createdAt: -1 });

  res.json({
    success: true,
    data: {
      storefront: owner.storefront,
      owner: { fullName: owner.fullName, avatar: owner.avatar, rating: owner.rating, memberSince: owner.createdAt },
      listings
    }
  });
}));

module.exports = router;
