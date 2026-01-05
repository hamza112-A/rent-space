const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// Simple in-memory store
let notifications = [];

// @route   GET /api/v1/notifications
router.get('/', protect, asyncHandler(async (req, res) => {
  const userNotifications = notifications
    .filter(n => n.userId === req.user._id.toString())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, data: userNotifications });
}));

// @route   GET /api/v1/notifications/unread-count
router.get('/unread-count', protect, asyncHandler(async (req, res) => {
  const count = notifications.filter(
    n => n.userId === req.user._id.toString() && !n.read
  ).length;

  res.json({ success: true, data: { count } });
}));

// @route   PUT /api/v1/notifications/:id/read
router.put('/:id/read', protect, asyncHandler(async (req, res) => {
  const notification = notifications.find(n => n._id === req.params.id);
  
  if (notification) {
    notification.read = true;
  }

  res.json({ success: true, message: 'Notification marked as read' });
}));

// @route   PUT /api/v1/notifications/read-all
router.put('/read-all', protect, asyncHandler(async (req, res) => {
  notifications
    .filter(n => n.userId === req.user._id.toString())
    .forEach(n => n.read = true);

  res.json({ success: true, message: 'All notifications marked as read' });
}));

// @route   DELETE /api/v1/notifications/:id
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  notifications = notifications.filter(n => n._id !== req.params.id);
  res.json({ success: true, message: 'Notification deleted' });
}));

module.exports = router;
