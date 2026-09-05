// One-time backfill for the owner/buyer profile split (ownerProfile/
// buyerProfile on User, revieweeRole on Review). Safe to re-run — every
// write is derived fresh from existing data, nothing is additive.
//
// Usage: node src/scripts/migrateRoleProfiles.js
//
// Reputation caveat: existing reviews predate `revieweeRole`, so historical
// ratings can't be split by role with certainty. Reviews are backfilled from
// their booking (revieweeId === booking.owner -> 'owner', else 'borrower');
// reviews whose booking is missing are skipped and logged. Both
// ownerProfile.rating and buyerProfile.rating are then seeded from each
// user's existing combined `rating` as a starting point — they will diverge
// naturally as new role-tagged reviews come in.

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Review = require('../models/Review');
const Booking = require('../models/Booking');

async function migrateReviews() {
  const reviews = await Review.find({ revieweeRole: { $exists: false } }).select('_id bookingId revieweeId');
  let updated = 0;
  let skipped = 0;

  for (const review of reviews) {
    const booking = await Booking.findById(review.bookingId).select('owner renter');
    if (!booking) {
      skipped += 1;
      console.warn(`Skipping review ${review._id}: booking ${review.bookingId} not found`);
      continue;
    }

    const revieweeRole = booking.owner?.toString() === review.revieweeId.toString() ? 'owner' : 'borrower';
    await Review.updateOne({ _id: review._id }, { $set: { revieweeRole } });
    updated += 1;
  }

  console.log(`Reviews: backfilled ${updated}, skipped ${skipped}`);
}

async function migrateUsers() {
  const users = await User.find({}).select(
    'role activeMode stats rating ownerProfile buyerProfile'
  );
  let updated = 0;

  for (const user of users) {
    const activeMode = user.activeMode || (user.role === 'borrower' ? 'borrower' : 'owner');

    user.activeMode = activeMode;

    user.ownerProfile = user.ownerProfile || {};
    user.ownerProfile.stats = {
      totalListings: user.stats?.totalListings || 0,
      activeListings: user.stats?.activeListings || 0,
      completedBookings: user.stats?.completedBookings || 0,
      totalEarnings: user.stats?.totalEarnings || 0
    };
    user.ownerProfile.rating = {
      average: user.rating?.average || 0,
      count: user.rating?.count || 0
    };

    user.buyerProfile = user.buyerProfile || {};
    user.buyerProfile.stats = {
      totalBookings: user.stats?.totalBookings || 0,
      completedBookings: user.stats?.completedBookings || 0,
      totalSpent: user.stats?.totalSpent || 0
    };
    user.buyerProfile.rating = {
      average: user.rating?.average || 0,
      count: user.rating?.count || 0
    };

    await user.save({ validateBeforeSave: false });
    updated += 1;
  }

  console.log(`Users: migrated ${updated}`);
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Starting migration...');

  await migrateReviews();
  await migrateUsers();

  console.log('Migration complete.');
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
