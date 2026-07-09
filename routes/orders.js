'use strict';

const express = require('express');
const validator = require('validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { verifyToken, optionalAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders - Create order
router.post('/', optionalAuth, async function(req, res) {
  try {
    const { customer, items, paymentMethod, notes } = req.body;

    // Validate customer info
    if (!customer || !customer.name || !customer.phone || !customer.city || !customer.address) {
      return res.status(400).json({ success: false, error: 'Customer name, phone, city, and address are required.' });
    }

    if (customer.name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Name must be at least 2 characters.' });
    }

    const cleanPhone = customer.phone.replace(/[\s-]/g, '');
    if (!/^0[3][0-9]{9}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, error: 'Invalid phone number. Use format: 03xx-xxxxxxx.' });
    }

    if (customer.email && !validator.isEmail(customer.email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format.' });
    }

    if (customer.city.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'City name is too short.' });
    }

    if (customer.address.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'Please provide a complete delivery address.' });
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Order must have at least one item.' });
    }

    // Calculate totals and verify prices
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ success: false, error: 'Invalid item in order.' });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ success: false, error: 'Product not found: ' + (item.name || item.product) });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: parseInt(item.quantity),
        image: product.images.length > 0 ? product.images[0] : ''
      });

      totalAmount += product.price * parseInt(item.quantity);
    }

    // Delivery charge
    const deliveryCharge = totalAmount >= 3000 ? 0 : 200;
    totalAmount += deliveryCharge;

    const order = await Order.create({
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: (customer.email || '').trim(),
        city: customer.city.trim(),
        address: customer.address.trim()
      },
      items: orderItems,
      totalAmount: totalAmount,
      deliveryCharge: deliveryCharge,
      paymentMethod: paymentMethod || 'cod',
      notes: (notes || '').trim(),
      user: req.user ? req.user._id : undefined
    });

    res.status(201).json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        deliveryCharge: order.deliveryCharge,
        status: order.status,
        items: order.items
      }
    });
  } catch (err) {
    console.error('[Orders] Create error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create order.' });
  }
});

// GET /api/orders - List all orders (admin only)
router.get('/', verifyToken, requireAdmin, async function(req, res) {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      orders: orders,
      pagination: { page: page, limit: limit, total: total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('[Orders] List error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch orders.' });
  }
});

// GET /api/orders/my - Get user's own orders
router.get('/my', verifyToken, async function(req, res) {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders: orders });
  } catch (err) {
    console.error('[Orders] My orders error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch orders.' });
  }
});

// PUT /api/orders/:id/status - Update order status (admin only)
router.put('/:id/status', verifyToken, requireAdmin, async function(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    res.json({ success: true, order: order });
  } catch (err) {
    console.error('[Orders] Status update error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update order status.' });
  }
});

// GET /api/orders/stats - Order statistics (admin only)
router.get('/stats', verifyToken, requireAdmin, async function(req, res) {
  try {
    const [total, pending, confirmed, shipped, delivered, cancelled] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'confirmed' }),
      Order.countDocuments({ status: 'shipped' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' })
    ]);

    const revenue = await Order.aggregate([
      { $match: { status: { $in: ['confirmed', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      stats: {
        total, pending, confirmed, shipped, delivered, cancelled,
        revenue: revenue.length > 0 ? revenue[0].total : 0
      }
    });
  } catch (err) {
    console.error('[Orders] Stats error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch stats.' });
  }
});

module.exports = router;
