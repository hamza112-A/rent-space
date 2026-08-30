const AdminAuditLog = require('../models/AdminAuditLog');

// Fire-and-forget audit write — an audit log failure must never block the
// admin action it's recording. See docs/redesign/11-admin-panel.md.
const logAdminAction = (req, { action, targetType, targetId, details }) => {
  AdminAuditLog.create({
    admin: req.user._id,
    adminRole: req.user.adminRole,
    action,
    targetType,
    targetId,
    details
  }).catch((err) => console.error('Failed to write admin audit log:', err.message));
};

module.exports = { logAdminAction };
