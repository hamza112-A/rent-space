/**
 * Script to sync all user subscriptions with correct plan details
 * Run: node scripts/syncSubscriptions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const SUBSCRIPTION_PLANS = {
  free: {
    maxListings: 5,
    listingDuration: 48,
    features: {
      prioritySupport: false,
      enhancedVisibility: false,
      analytics: false,
      featuredBadge: false,
      topVisibility: false
    }
  },
  basic: {
    maxListings: 20,
    listingDuration: 720,
    features: {
      prioritySupport: true,
      enhancedVisibility: true,
      analytics: true,
      featuredBadge: false,
      topVisibility: false
    }
  },
  premium: {
    maxListings: -1,
    listingDuration: -1,
    features: {
      prioritySupport: true,
      enhancedVisibility: true,
      analytics: true,
      featuredBadge: true,
      topVisibility: true
    }
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const syncSubscriptions = async () => {
  try {
    const users = await User.find({});
    let updated = 0;

    for (const user of users) {
      const currentPlan = user.subscription?.plan || 'free';
      const planDetails = SUBSCRIPTION_PLANS[currentPlan] || SUBSCRIPTION_PLANS.free;
      
      // Check if sync is needed
      const needsSync = 
        user.subscription?.maxListings !== planDetails.maxListings ||
        user.subscription?.listingDuration !== planDetails.listingDuration;
      
      if (needsSync) {
        user.subscription = {
          plan: currentPlan,
          status: user.subscription?.status || 'active',
          startDate: user.subscription?.startDate || new Date(),
          endDate: user.subscription?.endDate,
          autoRenew: user.subscription?.autoRenew || false,
          maxListings: planDetails.maxListings,
          listingDuration: planDetails.listingDuration,
          features: planDetails.features
        };
        
        await user.save();
        updated++;
        console.log(`Updated user ${user.email}: ${currentPlan} plan - maxListings: ${planDetails.maxListings}, duration: ${planDetails.listingDuration}`);
      }
    }

    console.log(`\nDone. Updated ${updated} of ${users.length} users.`);
    return updated;
  } catch (error) {
    console.error('Error syncing subscriptions:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  connectDB()
    .then(() => syncSubscriptions())
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = syncSubscriptions;
