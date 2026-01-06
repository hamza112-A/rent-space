/**
 * Script to auto-expire listings based on subscription plan
 * Run this as a cron job every hour: 0 * * * * node scripts/expireListings.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../src/models/Listing');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const expireListings = async () => {
  try {
    const now = new Date();
    
    // Find all active listings that have expired
    const expiredListings = await Listing.updateMany(
      {
        status: 'active',
        expiresAt: { $ne: null, $lte: now }
      },
      {
        $set: { status: 'expired' }
      }
    );

    console.log(`Expired ${expiredListings.modifiedCount} listings`);
    
    return expiredListings.modifiedCount;
  } catch (error) {
    console.error('Error expiring listings:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  connectDB()
    .then(() => expireListings())
    .then((count) => {
      console.log(`Done. ${count} listings expired.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = expireListings;
