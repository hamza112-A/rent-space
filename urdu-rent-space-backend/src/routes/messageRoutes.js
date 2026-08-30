const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');
const { upload } = require('../middleware/upload');
const { uploadToCloudinary } = require('../services/uploadService');

// True if either participant has blocked the other — checked before a
// conversation/message can be created, see docs/redesign/06-messages.md.
const isBlockedPair = async (userIdA, userIdB) => {
  const [a, b] = await Promise.all([
    User.findById(userIdA).select('blockedUsers'),
    User.findById(userIdB).select('blockedUsers')
  ]);
  const aBlockedB = a?.blockedUsers?.some((id) => id.toString() === userIdB.toString());
  const bBlockedA = b?.blockedUsers?.some((id) => id.toString() === userIdA.toString());
  return !!(aBlockedB || bBlockedA);
};

// @route   GET /api/v1/messages (get all conversations for current user only)
router.get('/', protect, asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const conversations = await Conversation.find({
    participants: userId
  })
    .populate('participants', 'fullName profileImage')
    .populate('listing', 'title images')
    .populate('lastMessage.sender', 'fullName')
    .sort({ updatedAt: -1 });

  // Attach a "Booking #..." chip when a booking exists between these two
  // participants for this conversation's listing, so a thread visually
  // distinguishes pre-booking inquiry from post-booking coordination.
  const conversationsWithUnread = await Promise.all(conversations.map(async (conv) => {
    const convObj = conv.toObject();
    convObj.unreadCount = conv.unreadCount?.get(req.user._id.toString()) || 0;

    if (conv.listing) {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== req.user._id.toString()
      );
      if (otherParticipant) {
        const booking = await Booking.findOne({
          listing: conv.listing._id || conv.listing,
          $or: [
            { renter: req.user._id, owner: otherParticipant._id },
            { renter: otherParticipant._id, owner: req.user._id }
          ]
        }).select('bookingId status').sort({ createdAt: -1 });
        if (booking) {
          convObj.booking = { _id: booking._id, bookingId: booking.bookingId, status: booking.status };
        }
      }
    }

    return convObj;
  }));

  res.json({ success: true, data: conversationsWithUnread });
}));

// @route   GET /api/v1/messages/:id/messages
router.get('/:id/messages', protect, asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const conversation = await Conversation.findById(req.params.id);
  
  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  // Check if user is participant - compare ObjectIds properly
  const isParticipant = conversation.participants.some(
    p => p.toString() === userId.toString()
  );
  
  if (!isParticipant) {
    return res.status(403).json({ success: false, message: 'Not authorized to view this conversation' });
  }

  const messages = await Message.find({ conversation: req.params.id })
    .populate('sender', 'fullName profileImage')
    .sort({ createdAt: 1 });

  // Mark messages as read
  await Message.updateMany(
    { 
      conversation: req.params.id, 
      sender: { $ne: userId },
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

  if (await isBlockedPair(req.user._id, participantId)) {
    return res.status(403).json({ success: false, message: 'You cannot message this user' });
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
router.post('/:id/messages', protect, upload.array('images', 5), asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content && !req.files?.length) {
    return res.status(400).json({ success: false, message: 'Message content or an attachment is required' });
  }

  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  // Check if user is participant
  if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const otherParticipant = conversation.participants.find(
    (p) => p.toString() !== req.user._id.toString()
  );
  if (otherParticipant && await isBlockedPair(req.user._id, otherParticipant)) {
    return res.status(403).json({ success: false, message: 'You cannot message this user' });
  }

  let attachments = [];
  if (req.files?.length) {
    attachments = await Promise.all(req.files.map(async (file) => {
      try {
        const result = await uploadToCloudinary(file.buffer, { folder: 'message-attachments' });
        return { public_id: result.public_id, url: result.secure_url, type: 'image' };
      } catch (err) {
        const base64 = file.buffer.toString('base64');
        return { public_id: `local_${Date.now()}`, url: `data:${file.mimetype};base64,${base64}`, type: 'image' };
      }
    }));
  }

  const message = await Message.create({
    conversation: req.params.id,
    sender: req.user._id,
    content: content || '',
    attachments
  });

  // Update conversation with last message
  conversation.lastMessage = {
    content: content || (attachments.length ? '📷 Photo' : ''),
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
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const conversation = await Conversation.findById(req.params.id);
  
  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  // Check if user is participant
  const isParticipant = conversation.participants.some(
    p => p.toString() === userId.toString()
  );
  
  if (!isParticipant) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  // Mark all messages as read
  await Message.updateMany(
    { 
      conversation: req.params.id, 
      sender: { $ne: userId },
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
