const express = require('express');
const router = express.Router();
const { protect, ownerOnly } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const Organization = require('../models/Organization');

// Plan id is checked directly against the user's live subscription rather
// than the (possibly stale, lazily-synced) cached features blob — same
// pattern as the business-plan gate in listingRoutes.js's bulk-upload route.
const isBusinessPlan = (user) => user.subscription?.plan === 'business';

const getOrCreateOrganization = async (user) => {
  let org = await Organization.findOne({ owner: user._id });
  if (!org) {
    org = await Organization.create({ name: `${user.fullName}'s Team`, owner: user._id, members: [] });
    user.organization = { id: org._id, role: 'owner' };
    await user.save();
  }
  return org;
};

const populateOrg = (query) => query
  .populate('owner', 'fullName email')
  .populate('members.user', 'fullName email phone');

// @route   GET /api/v1/organizations/me
// @desc    Get the current user's team (as owner or member); auto-creates
//          the organization for a Business-plan owner on first visit.
// @access  Private (owner role)
router.get('/me', protect, ownerOnly, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.organization?.id) {
    const org = await populateOrg(Organization.findById(user.organization.id));
    if (org) {
      return res.json({ success: true, data: { organization: org, myRole: user.organization.role } });
    }
  }

  if (!isBusinessPlan(user)) {
    return res.status(403).json({
      success: false,
      message: 'Team accounts are available on the Business plan only.',
      upgradeRequired: true
    });
  }

  const org = await getOrCreateOrganization(user);
  const populated = await populateOrg(Organization.findById(org._id));
  res.json({ success: true, data: { organization: populated, myRole: 'owner' } });
}));

// @route   POST /api/v1/organizations/members
// @desc    Add an existing registered user to the team by email
// @access  Private (organization owner only)
router.post('/members', protect, ownerOnly, asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const user = await User.findById(req.user._id);
  if (!isBusinessPlan(user)) {
    return res.status(403).json({
      success: false,
      message: 'Team accounts are available on the Business plan only.',
      upgradeRequired: true
    });
  }

  const org = await getOrCreateOrganization(user);

  const invitee = await User.findOne({ email: email.toLowerCase().trim() });
  if (!invitee) {
    return res.status(404).json({
      success: false,
      message: 'No registered user found with that email. They need to sign up first.'
    });
  }
  if (invitee._id.toString() === user._id.toString()) {
    return res.status(400).json({ success: false, message: "You're already the team owner." });
  }
  if (invitee.organization?.id) {
    return res.status(400).json({ success: false, message: 'That user already belongs to a team.' });
  }

  org.members.push({ user: invitee._id, role: 'staff' });
  await org.save();

  invitee.organization = { id: org._id, role: 'staff' };
  await invitee.save();

  const populated = await populateOrg(Organization.findById(org._id));
  res.json({ success: true, message: `${invitee.fullName} added to your team`, data: populated });
}));

// @route   PUT /api/v1/organizations/members/:userId
// @desc    Change a team member's role (admin/staff)
// @access  Private (organization owner only)
router.put('/members/:userId', protect, ownerOnly, asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'staff'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be admin or staff' });
  }

  const org = await Organization.findOne({ owner: req.user._id });
  if (!org) {
    return res.status(404).json({ success: false, message: 'Organization not found' });
  }

  const member = org.members.find((m) => m.user.toString() === req.params.userId);
  if (!member) {
    return res.status(404).json({ success: false, message: 'Member not found' });
  }

  member.role = role;
  await org.save();
  await User.findByIdAndUpdate(req.params.userId, { 'organization.role': role });

  res.json({ success: true, message: 'Member role updated' });
}));

// @route   DELETE /api/v1/organizations/members/:userId
// @desc    Remove a team member
// @access  Private (organization owner only)
router.delete('/members/:userId', protect, ownerOnly, asyncHandler(async (req, res) => {
  const org = await Organization.findOne({ owner: req.user._id });
  if (!org) {
    return res.status(404).json({ success: false, message: 'Organization not found' });
  }

  const before = org.members.length;
  org.members = org.members.filter((m) => m.user.toString() !== req.params.userId);
  if (org.members.length === before) {
    return res.status(404).json({ success: false, message: 'Member not found' });
  }
  await org.save();

  await User.findByIdAndUpdate(req.params.userId, { $unset: { organization: 1 } });

  res.json({ success: true, message: 'Member removed' });
}));

module.exports = router;
