'use strict';

const express = require('express');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/wishlist - Get user's wishlist
router.get('/', verifyToken, async function(req, res) {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    const wishlist = (user.wishlist || []).filter(function(p) { return p; });
    res.json({ success: true, wishlist: wishlist });
  } catch (err) {
    console.error('[Wishlist] Get error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch wishlist.' });
  }
});

// POST /api/wishlist - Toggle item in wishlist
router.post('/', verifyToken, async function(req, res) {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required.' });
    }

    const user = await User.findById(req.user._id);
    const index = user.wishlist.indexOf(productId);

    let action;
    if (index > -1) {
      user.wishlist.splice(index, 1);
      action = 'removed';
    } else {
      user.wishlist.push(productId);
      action = 'added';
    }

    await user.save();

    res.json({
      success: true,
      action: action,
      wishlist: user.wishlist
    });
  } catch (err) {
    console.error('[Wishlist] Toggle error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update wishlist.' });
  }
});

// DELETE /api/wishlist/:productId - Remove from wishlist
router.delete('/:productId', verifyToken, async function(req, res) {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist.pull(req.params.productId);
    await user.save();

    res.json({ success: true, message: 'Removed from wishlist.' });
  } catch (err) {
    console.error('[Wishlist] Remove error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to remove from wishlist.' });
  }
});

module.exports = router;
