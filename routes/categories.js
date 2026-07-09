'use strict';

const express = require('express');
const Category = require('../models/Category');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/categories - List all active categories
router.get('/', async function(req, res) {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, categories: categories });
  } catch (err) {
    console.error('[Categories] List error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch categories.' });
  }
});

// POST /api/categories - Create category (admin only)
router.post('/', verifyToken, requireAdmin, async function(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required.' });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Category already exists.' });
    }

    const count = await Category.countDocuments();
    const category = await Category.create({ name: name.trim(), order: count });

    res.status(201).json({ success: true, category: category });
  } catch (err) {
    console.error('[Categories] Create error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create category.' });
  }
});

// PUT /api/categories/:id - Update category (admin only)
router.put('/:id', verifyToken, requireAdmin, async function(req, res) {
  try {
    const { name, order, isActive } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (order !== undefined) update.order = parseInt(order);
    if (isActive !== undefined) update.isActive = isActive === true || isActive === 'true';

    const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    res.json({ success: true, category: category });
  } catch (err) {
    console.error('[Categories] Update error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update category.' });
  }
});

// DELETE /api/categories/:id - Delete category (admin only)
router.delete('/:id', verifyToken, requireAdmin, async function(req, res) {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    console.error('[Categories] Delete error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete category.' });
  }
});

module.exports = router;
