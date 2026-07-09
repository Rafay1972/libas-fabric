'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Multer config for product image uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function(req, file, cb) {
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

// GET /api/products - List all products
router.get('/', async function(req, res) {
  try {
    const filter = { isActive: true };
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, products: products });
  } catch (err) {
    console.error('[Products] List error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch products.' });
  }
});

// GET /api/products/all - List all products including inactive (admin)
router.get('/all', verifyToken, requireAdmin, async function(req, res) {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products: products });
  } catch (err) {
    console.error('[Products] Admin list error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch products.' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async function(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }
    res.json({ success: true, product: product });
  } catch (err) {
    console.error('[Products] Get error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch product.' });
  }
});

// POST /api/products - Create product (admin only)
router.post('/', verifyToken, requireAdmin, upload.array('images', 6), async function(req, res) {
  try {
    const { name, category, price, oldPrice, description, stock, imageUrls } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ success: false, error: 'Name, category, and price are required.' });
    }

    let images = [];

    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      images = req.files.map(function(file) {
        return '/uploads/products/' + file.filename;
      });
    }

    // Handle base64 or URL images passed as JSON
    if (imageUrls) {
      try {
        const urls = JSON.parse(imageUrls);
        if (Array.isArray(urls)) {
          images = images.concat(urls);
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    const product = await Product.create({
      name: name.trim(),
      category: category.trim(),
      price: parseFloat(price),
      oldPrice: oldPrice ? parseFloat(oldPrice) : 0,
      description: (description || '').trim(),
      images: images,
      stock: stock !== undefined ? parseInt(stock) : -1
    });

    res.status(201).json({ success: true, product: product });
  } catch (err) {
    console.error('[Products] Create error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create product.' });
  }
});

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', verifyToken, requireAdmin, upload.array('images', 6), async function(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const { name, category, price, oldPrice, description, stock, isActive, imageUrls, keepExistingImages } = req.body;

    if (name) product.name = name.trim();
    if (category) product.category = category.trim();
    if (price !== undefined) product.price = parseFloat(price);
    if (oldPrice !== undefined) product.oldPrice = parseFloat(oldPrice);
    if (description !== undefined) product.description = description.trim();
    if (stock !== undefined) product.stock = parseInt(stock);
    if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;

    // Handle image updates
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map(function(file) {
        return '/uploads/products/' + file.filename;
      });
    }

    if (imageUrls) {
      try {
        const urls = JSON.parse(imageUrls);
        if (Array.isArray(urls)) {
          newImages = newImages.concat(urls);
        }
      } catch (e) {
        // ignore
      }
    }

    if (keepExistingImages === 'true' || keepExistingImages === true) {
      product.images = product.images.concat(newImages);
    } else if (newImages.length > 0) {
      product.images = newImages;
    }

    await product.save();
    res.json({ success: true, product: product });
  } catch (err) {
    console.error('[Products] Update error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update product.' });
  }
});

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', verifyToken, requireAdmin, async function(req, res) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    // Clean up uploaded images
    product.images.forEach(function(img) {
      if (img.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', img);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });

    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    console.error('[Products] Delete error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete product.' });
  }
});

module.exports = router;
