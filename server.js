'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const { connectDatabase } = require('./config/database');

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const slideRoutes = require('./routes/slides');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const contactRoutes = require('./routes/contact');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// --- Security Middleware ---

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://placehold.co"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

app.use(compression());

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: false, limit: '20mb' }));

app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: function(obj) {
    console.warn('[Security] NoSQL injection attempt blocked on key:', obj.key);
  }
}));

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts. Try again later.' }
});

// --- Static Files ---

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d'
}));

// Serve public static files
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 0,
  etag: false,
  lastModified: false,
  setHeaders: function(res, filePath) {
    if (filePath.endsWith('.css')) res.set('Content-Type', 'text/css');
    if (filePath.endsWith('.js')) res.set('Content-Type', 'application/javascript');
  }
}));

// No-cache for HTML pages during development
app.use(function(req, res, next) {
  if (req.path.endsWith('.html') || req.path === '/') {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
  next();
});

// --- API Routes ---

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/categories', apiLimiter, categoryRoutes);
app.use('/api/slides', apiLimiter, slideRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/cart', apiLimiter, cartRoutes);
app.use('/api/wishlist', apiLimiter, wishlistRoutes);
app.use('/api/contact', apiLimiter, contactRoutes);

// --- Health Check ---

app.get('/api/health', function(req, res) {
  const mongoose = require('mongoose');
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: Math.floor(process.uptime())
  });
});

// --- Admin Dashboard ---

const adminSlug = process.env.ADMIN_SLUG || 'manage-hq-7x4p';

app.get('/' + adminSlug, function(req, res) {
  res.sendFile(path.join(__dirname, 'views', 'admin-dashboard.html'));
});

// Honeypot: common admin URLs return 404
app.get(['/admin', '/wp-admin', '/login', '/dashboard', '/panel', '/backend'], function(req, res) {
  res.status(404).send('Not Found');
});

// --- Page Routes ---

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Global Error Handler ---

app.use(function(err, req, res, next) {
  console.error('[Server Error]', err.message);
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, error: 'File upload error: ' + err.message });
  }
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

// --- Start ---

async function start() {
  try {
    await connectDatabase();
    console.log('[Server] Database connected.');

    // Seed admin user if not exists
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'Hidayah@2026', 12);
      await User.create({
        email: process.env.ADMIN_EMAIL || 'admin@hidayah.shop',
        password: hashedPassword,
        name: 'Admin',
        role: 'admin'
      });
      console.log('[Server] Default admin account created.');
    }

    // Seed default categories if empty
    const Category = require('./models/Category');
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      const defaultCats = ['Lawn', 'Khaddar', 'Cotton', 'Silk', 'Chiffon', 'Linen', 'Jamawar', 'Karandi', 'Wash & Wear', 'Boski'];
      await Category.insertMany(defaultCats.map(function(name, i) {
        return { name: name, order: i };
      }));
      console.log('[Server] Default categories seeded.');
    }

  } catch (err) {
    console.error('[Server] Database connection failed:', err.message);
    console.warn('[Server] Starting without database. Frontend will use localStorage fallback.');
  }

  app.listen(PORT, function() {
    console.log('[Server] Running on http://localhost:' + PORT);
    console.log('[Server] Admin panel: http://localhost:' + PORT + '/' + adminSlug);
  });
}

start();
