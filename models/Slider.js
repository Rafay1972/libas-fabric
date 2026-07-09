'use strict';

const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema({
  image: {
    type: String,
    required: [true, 'Slider image is required']
  },
  title: {
    type: String,
    trim: true,
    default: 'New Arrival'
  },
  subtitle: {
    type: String,
    trim: true,
    default: 'Premium Fabric'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Slider', sliderSchema);
