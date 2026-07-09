'use strict';

const mongoose = require('mongoose');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set.');
  }

  mongoose.set('strictQuery', false);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000
  });

  mongoose.connection.on('error', function(err) {
    console.error('[Database] Connection error:', err.message);
  });

  mongoose.connection.on('disconnected', function() {
    console.warn('[Database] Disconnected from MongoDB.');
  });

  return mongoose.connection;
}

module.exports = { connectDatabase };
