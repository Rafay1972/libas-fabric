'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Slider = require('../models/Slider');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = path.join(__dirname, '..', 'uploads', 'slides');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    cb(null, 'slide-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function(req, file, cb) {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed.'));
    }
  }
});

// GET /api/slides - List all active slides
router.get('/', async function(req, res) {
  try {
    const slides = await Slider.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, slides: slides });
  } catch (err) {
    console.error('[Slides] List error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch slides.' });
  }
});

// POST /api/slides - Create slide (admin only)
router.post('/', verifyToken, requireAdmin, upload.single('image'), async function(req, res) {
  try {
    const { title, subtitle, imageUrl } = req.body;

    let image = '';
    if (req.file) {
      image = '/uploads/slides/' + req.file.filename;
    } else if (imageUrl) {
      image = imageUrl;
    } else {
      return res.status(400).json({ success: false, error: 'Slider image is required.' });
    }

    const count = await Slider.countDocuments();
    if (count >= 6) {
      return res.status(400).json({ success: false, error: 'Maximum 6 slides allowed.' });
    }

    const slide = await Slider.create({
      image: image,
      title: (title || 'New Arrival').trim(),
      subtitle: (subtitle || 'Premium Fabric').trim(),
      order: count
    });

    res.status(201).json({ success: true, slide: slide });
  } catch (err) {
    console.error('[Slides] Create error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create slide.' });
  }
});

// DELETE /api/slides/:id - Delete slide (admin only)
router.delete('/:id', verifyToken, requireAdmin, async function(req, res) {
  try {
    const slide = await Slider.findByIdAndDelete(req.params.id);
    if (!slide) {
      return res.status(404).json({ success: false, error: 'Slide not found.' });
    }

    if (slide.image.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', slide.image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: 'Slide deleted.' });
  } catch (err) {
    console.error('[Slides] Delete error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete slide.' });
  }
});

module.exports = router;
