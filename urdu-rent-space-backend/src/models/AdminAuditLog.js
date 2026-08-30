const mongoose = require('mongoose');

// Records who did what to whom in the admin panel — see
// docs/redesign/11-admin-panel.md. Append-only; nothing ever edits or
// deletes an entry once written.
const adminAuditLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminRole: String,
  action: {
    type: String,
    required: true
  },
  targetType: {
    type: String,
    enum: ['user', 'listing', 'booking', 'verification', 'payout', 'dispute', 'report', 'category'],
    required: true
  },
  targetId: mongoose.Schema.Types.ObjectId,
  details: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ admin: 1, createdAt: -1 });
adminAuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
