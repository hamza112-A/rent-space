const mongoose = require('mongoose');

// Business-tier multi-user team accounts — see "Multi-user team accounts"
// in docs/redesign/02-subscription-tiers.md. One organization per billing
// owner; staff/admin members share the owner's listings and subscription
// limits instead of having their own.
const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: [150, 'Organization name cannot exceed 150 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
    addedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Organization', organizationSchema);
