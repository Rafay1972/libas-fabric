'use strict';

const express = require('express');
const validator = require('validator');
const Contact = require('../models/Contact');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/contact - Admin: Get all contact messages
router.get('/', verifyToken, requireAdmin, async function(req, res) {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, messages });
  } catch (err) {
    console.error('[Contact] Fetch error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch messages.' });
  }
});

// POST /api/contact - Handle contact form submission
router.post('/', async function(req, res) {
  try {
    const { name, email, phone, message } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required.' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Name must be at least 2 characters.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format.' });
    }
    if (phone) {
      const cleanPhone = phone.replace(/[\s-]/g, '');
      if (!/^0[3][0-9]{9}$/.test(cleanPhone) && !/^\+92[3][0-9]{9}$/.test(cleanPhone)) {
        return res.status(400).json({ success: false, error: 'Invalid phone format. Use 03xx-xxxxxxx.' });
      }
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }
    if (message.trim().length < 10) {
      return res.status(400).json({ success: false, error: 'Message must be at least 10 characters.' });
    }

    // Save to database
    await Contact.create({
      name: name.trim(),
      email: email.trim(),
      phone: (phone || '').trim(),
      message: message.trim()
    });

    res.json({ success: true, message: 'Thank you for contacting us! We will respond within 24 hours.' });
  } catch (err) {
    console.error('[Contact] Submit error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to submit message.' });
  }
});

// PUT /api/contact/:id/read - Admin: Mark message as read
router.put('/:id/read', verifyToken, requireAdmin, async function(req, res) {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, { status: 'read' }, { new: true });
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Message not found.' });
    }
    res.json({ success: true, message: 'Message marked as read.' });
  } catch (err) {
    console.error('[Contact] Update error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update message.' });
  }
});

module.exports = router;
