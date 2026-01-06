const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Listing = require('../models/Listing');

// @route   GET /api/v1/messages (get all conversations)
router.get('/', protect, asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id
  })
    .populate('participants', 'fullName profileImage')
    .populate('listing', 'title images')
    .populate('lastMessage.sender', 'fullName')
    .sort({ updatedAt: -1 });

  // Add unread count for current user
  const conversationsWithUnread = conversations.map(conv => {
    const convObj = conv.toObject();
    convObj.unreadCount = conv.unreadCount?.get(req.user._id.toString()) || 0;
    return convObj;
  });

  res.json({ success: true, data: conversationsWithUnread });
}));

// @route   GET /api/v1/messages/:id/messages
router.get('/:id/messages', protect, asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  
  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  // Check if user is participant
  if (!conversation.participants.includes(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const messages = await Message.find({ conversation: req.params.id })
    .populate('sender', 'fullName profileImage')
    .sort({ createdAt: 1 });

  // Mark messages as read
  await Message.updateMany(
    { 
      conversation: req.params.id, 
      sender: { $ne: req.user._id },
      read: false 
    },
    { read: true, readAt: new Date() }
  );

  // Reset unread count for this user
  conversation.unreadCount.set(req.user._id.toString(), 0);
  await conversation.save();

  res.json({ success: true, data: messages });
}));

// @route   POST /api/v1/messages (create conversation or send first message)
router.post('/', protect, asyncHandler(async (req, res) => {
  const { participantId, listingId, content } = req.body;

  if (!participantId) {
    return res.status(400).json({ success: false, message: 'Participant ID is required' });
  }

  // Check if conversation exists
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, participantId] },
    ...(listingId && { listing: listingId })
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, participantId],
      listing: listingId || null,
      unreadCount: new Map()
    });
  }

  // If content is provided, also send a message
  if (content) {
    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content
    });

    // Update conversation with last message
    conversation.lastMessage = {
      content,
      sender: req.user._id,
      createdAt: new Date()
    };

    // Increment unread count for other participant
    const otherParticipant = conversation.participants.find(
      p => p.toString() !== req.user._id.toString()
    );
    const currentUnread = conversation.unreadCount.get(otherParticipant.toString()) || 0;
    conversation.unreadCount.set(otherParticipant.toString(), currentUnread + 1);
    
    await conversation.save();
  }

  // Populate and return
  await conversation.populate('participants', 'fullName profileImage');
  await conversation.populate('listing', 'title images');

  res.status(201).json({ success: true, data: conversation });
}));

// @route   POST /api/v1/messages/:id/messages
router.post('/:id/messages', protect, asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ success: false, message: 'Message content is required' });
  }

  const conversation = await Conversation.findById(req.params.id);
  
  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  // Check if user is participant
  if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const message = await Message.create({
    conversation: req.params.id,
    sender: req.user._id,
    content
  });

  // Update conversation with last message
  conversation.lastMessage = {
    content,
    sender: req.user._id,
    createdAt: new Date()
  };

  // Increment unread count for other participants
  conversation.participants.forEach(participantId => {
    if (participantId.toString() !== req.user._id.toString()) {
      const currentUnread = conversation.unreadCount.get(participantId.toString()) || 0;
      conversation.unreadCount.set(participantId.toString(), currentUnread + 1);
    }
  });

  await conversation.save();

  // Populate sender and return
  await message.populate('sender', 'fullName profileImage');

  res.status(201).json({ success: true, data: message });
}));

// @route   POST /api/v1/messages/:id/read
router.post('/:id/read', protect, asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  
  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  // Mark all messages as read
  await Message.updateMany(
    { 
      conversation: req.params.id, 
      sender: { $ne: req.user._id },
      read: false 
    },
    { read: true, readAt: new Date() }
  );

  // Reset unread count
  conversation.unreadCount.set(req.user._id.toString(), 0);
  await conversation.save();

  res.json({ success: true, message: 'Messages marked as read' });
}));

module.exports = router;
