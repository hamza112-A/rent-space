const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');

// Simple in-memory store (replace with MongoDB model in production)
let conversations = [];
let messages = [];

// @route   GET /api/v1/conversations
router.get('/', protect, asyncHandler(async (req, res) => {
  const userConversations = conversations.filter(
    c => c.participants.includes(req.user._id.toString())
  );
  res.json({ success: true, data: userConversations });
}));

// @route   GET /api/v1/conversations/:id/messages
router.get('/:id/messages', protect, asyncHandler(async (req, res) => {
  const conversationMessages = messages.filter(m => m.conversationId === req.params.id);
  res.json({ success: true, data: conversationMessages });
}));

// @route   POST /api/v1/conversations
router.post('/', protect, asyncHandler(async (req, res) => {
  const { participantId, listingId } = req.body;

  // Check if conversation exists
  let conversation = conversations.find(
    c => c.participants.includes(req.user._id.toString()) && 
         c.participants.includes(participantId) &&
         c.listingId === listingId
  );

  if (!conversation) {
    conversation = {
      _id: new mongoose.Types.ObjectId().toString(),
      participants: [req.user._id.toString(), participantId],
      listingId,
      createdAt: new Date()
    };
    conversations.push(conversation);
  }

  res.status(201).json({ success: true, data: conversation });
}));

// @route   POST /api/v1/conversations/:id/messages
router.post('/:id/messages', protect, asyncHandler(async (req, res) => {
  const { content } = req.body;

  const message = {
    _id: new mongoose.Types.ObjectId().toString(),
    conversationId: req.params.id,
    sender: req.user._id,
    content,
    createdAt: new Date()
  };

  messages.push(message);
  res.status(201).json({ success: true, data: message });
}));

module.exports = router;
