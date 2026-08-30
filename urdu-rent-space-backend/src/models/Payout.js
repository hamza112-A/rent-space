const mongoose = require('mongoose');

// Represents a single payout request from an owner's available balance to
// their bank/wallet (manual rail) or Stripe Connect account (automated rail,
// see 08-earnings.md in docs/redesign for why Stripe Connect is a sandbox/demo
// path only until a local payout rail exists for Pakistan).
const payoutSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Payout amount must be greater than zero']
  },
  currency: {
    type: String,
    enum: ['PKR', 'USD'],
    default: 'PKR'
  },
  method: {
    type: String,
    enum: ['stripe', 'bank_transfer', 'jazzcash', 'easypaisa'],
    required: true
  },
  // Snapshot of the payout method's details at request time, so a later
  // edit/removal of the payout method on the user's account doesn't change
  // where this historical payout record says the money went.
  destination: mongoose.Schema.Types.Mixed,

  status: {
    type: String,
    // stripe: pending -> processing -> paid | failed (automated)
    // manual rails: pending -> paid | failed (set by an admin once the
    // transfer has actually been made outside the platform)
    enum: ['pending', 'processing', 'paid', 'failed'],
    default: 'pending'
  },

  stripeTransferId: String,
  failureReason: String,

  // Admin who marked a manual payout as paid/failed, for accountability.
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  requestedAt: { type: Date, default: Date.now },
  processedAt: Date
}, {
  timestamps: true
});

payoutSchema.index({ user: 1, status: 1, createdAt: -1 });
payoutSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Payout', payoutSchema);
