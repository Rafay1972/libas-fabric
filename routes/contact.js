'use strict';

const express = require('express');
const validator = require('validator');

const router = express.Router();

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

    // For now, log the contact submission (could be saved to DB or sent via email later)
    console.log('[Contact] New submission:', {
      name: name.trim(),
      email: email.trim(),
      phone: (phone || '').trim(),
      message: message.trim(),
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Thank you for contacting us! We will respond within 24 hours.' });
  } catch (err) {
    console.error('[Contact] Submit error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to submit message.' });
  }
});

module.exports = router;
