// One-time fixup: activates listings still sitting in the 'pending'
// moderation queue from before listing creation was switched to publish
// immediately (see listingRoutes.js POST '/'). Safe to re-run — a listing
// only updates once (pending -> active), after which this is a no-op for it.
//
// Usage: node src/scripts/activatePendingListings.js

require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/Listing');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Activating pending listings...');

  const result = await Listing.updateMany(
    { status: 'pending' },
    { $set: { status: 'active', publishedAt: new Date() } }
  );

  console.log(`Listings: activated ${result.modifiedCount} of ${result.matchedCount} matched`);
  console.log('Done.');
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('Activation failed:', error);
  process.exit(1);
});
