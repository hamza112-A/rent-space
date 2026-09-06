// One-time backfill: fills in any pricing tier left blank on existing
// listings by deriving it from whichever tier the owner did set (same logic
// as the Listing pre-save hook added alongside this script). Never
// overwrites a tier that already has a value — safe to re-run.
//
// Usage: node src/scripts/backfillListingPricing.js

require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/Listing');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Starting listing pricing backfill...');

  const listings = await Listing.find({}).select('pricing');
  let updated = 0;

  for (const listing of listings) {
    const { hourly, daily, weekly, monthly } = listing.pricing || {};
    const dailyEquivalent = daily || (hourly ? hourly * 24 : 0) || (weekly ? weekly / 7 : 0) || (monthly ? monthly / 30 : 0);

    if (dailyEquivalent <= 0) continue;

    const updates = {};
    if (daily == null) updates['pricing.daily'] = Math.round(dailyEquivalent);
    if (hourly == null) updates['pricing.hourly'] = Math.round(dailyEquivalent / 24);
    if (weekly == null) updates['pricing.weekly'] = Math.round(dailyEquivalent * 7);
    if (monthly == null) updates['pricing.monthly'] = Math.round(dailyEquivalent * 30);

    if (Object.keys(updates).length > 0) {
      await Listing.updateOne({ _id: listing._id }, { $set: updates });
      updated += 1;
    }
  }

  console.log(`Listings: backfilled pricing on ${updated} of ${listings.length}`);
  console.log('Backfill complete.');
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
