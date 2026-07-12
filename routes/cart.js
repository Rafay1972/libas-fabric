'use strict';

const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/cart - Get user's cart
router.get('/', verifyToken, async function(req, res) {
  try {
    const user = await User.findById(req.user._id).populate('cart.product');

    const cartItems = (user.cart || [])
      .filter(function(item) { return item.product; })
      .map(function(item) {
        return {
          _id: item._id,
          product: {
            _id: item.product._id,
            name: item.product.name,
            price: item.product.price,
            oldPrice: item.product.oldPrice,
            category: item.product.category,
            images: item.product.images,
            stock: item.product.stock
          },
          quantity: item.quantity
        };
      });

    res.json({ success: true, cart: cartItems });
  } catch (err) {
    console.error('[Cart] Get error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch cart.' });
  }
});

// POST /api/cart - Add item to cart
router.post('/', verifyToken, async function(req, res) {
  try {
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const qty = parseInt(quantity) || 1;
    if (qty < 1) {
      return res.status(400).json({ success: false, error: 'Quantity must be at least 1.' });
    }

    const user = await User.findById(req.user._id);
    const existingItem = user.cart.find(function(item) {
      return item.product?.toString() === productId;
    });

    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      user.cart.push({ product: productId, quantity: qty });
    }

    await user.save();

    // Return updated cart
    const populated = await User.findById(req.user._id).populate('cart.product');
    const cartItems = populated.cart
      .filter(function(item) { return item.product; })
      .map(function(item) {
        return {
          _id: item._id,
          product: {
            _id: item.product._id,
            name: item.product.name,
            price: item.product.price,
            oldPrice: item.product.oldPrice,
            category: item.product.category,
            images: item.product.images
          },
          quantity: item.quantity
        };
      });

    res.json({ success: true, cart: cartItems });
  } catch (err) {
    console.error('[Cart] Add error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to add to cart.' });
  }
});

// PUT /api/cart/:itemId - Update cart item quantity
router.put('/:itemId', verifyToken, async function(req, res) {
  try {
    const { quantity } = req.body;
    const qty = parseInt(quantity);

    if (!qty || qty < 1) {
      return res.status(400).json({ success: false, error: 'Quantity must be at least 1.' });
    }

    const user = await User.findById(req.user._id);
    const item = user.cart.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Cart item not found.' });
    }

    item.quantity = qty;
    await user.save();

    res.json({ success: true, message: 'Cart updated.' });
  } catch (err) {
    console.error('[Cart] Update error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update cart.' });
  }
});

// DELETE /api/cart/:itemId - Remove item from cart
router.delete('/:itemId', verifyToken, async function(req, res) {
  try {
    const user = await User.findById(req.user._id);
    user.cart.pull({ _id: req.params.itemId });
    await user.save();

    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) {
    console.error('[Cart] Remove error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to remove from cart.' });
  }
});

// DELETE /api/cart - Clear entire cart
router.delete('/', verifyToken, async function(req, res) {
  try {
    await User.findByIdAndUpdate(req.user._id, { cart: [] });
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    console.error('[Cart] Clear error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to clear cart.' });
  }
});

module.exports = router;
