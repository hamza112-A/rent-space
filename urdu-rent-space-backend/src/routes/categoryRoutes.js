const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Category = require('../models/Category');
const asyncHandler = require('../middleware/asyncHandler');

// @route   GET /api/v1/categories
router.get('/', asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('order');
  res.json({ success: true, data: categories });
}));

// @route   GET /api/v1/categories/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  res.json({ success: true, data: category });
}));

// @route   POST /api/v1/categories (Admin only)
router.post('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, data: category });
}));

// @route   PUT /api/v1/categories/:id (Admin only)
router.put('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  res.json({ success: true, data: category });
}));

// @route   DELETE /api/v1/categories/:id (Admin only)
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  res.json({ success: true, message: 'Category deleted' });
}));

module.exports = router;
