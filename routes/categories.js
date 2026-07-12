'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Category = require('../models/Category');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'categories');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed.'));
    }
  }
});

// GET /api/categories - List all active categories
router.get('/', async function (req, res) {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, categories: categories });
  } catch (err) {
    console.error('[Categories] List error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch categories.' });
  }
});

// POST /api/categories - Create category (admin only)
router.post('/', verifyToken, requireAdmin, upload.single('image'), async function (req, res) {
  try {
    const { name, imageUrl } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required.' });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Category already exists.' });
    }

    const count = await Category.countDocuments();
    const image = req.file ? '/uploads/categories/' + req.file.filename : (imageUrl || '');
    const category = await Category.create({ name: name.trim(), order: count, image: image });

    res.status(201).json({ success: true, category: category });
  } catch (err) {
    console.error('[Categories] Create error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create category.' });
  }
});

// PUT /api/categories/:id - Update category (admin only)
router.put('/:id', verifyToken, requireAdmin, upload.single('image'), async function (req, res) {
  try {
    const { name, order, isActive, imageUrl, keepExistingImage } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (order !== undefined) update.order = parseInt(order);
    if (isActive !== undefined) update.isActive = isActive === true || isActive === 'true';

    const existing = await Category.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    if (req.file) {
      if (existing.image && existing.image.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', existing.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      update.image = '/uploads/categories/' + req.file.filename;
    } else if (imageUrl !== undefined) {
      update.image = imageUrl;
    } else if (keepExistingImage !== 'true' && keepExistingImage !== true) {
      update.image = existing.image || '';
    }

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
router.delete('/:id', verifyToken, requireAdmin, async function (req, res) {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    if (category.image && category.image.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', category.image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    console.error('[Categories] Delete error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete category.' });
  }
});

module.exports = router;
