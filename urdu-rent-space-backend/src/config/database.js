const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ Database connection failed (attempt ${attempt}/${MAX_RETRIES}):`, error.message);

    if (attempt >= MAX_RETRIES) {
      console.error('❌ Giving up after max retries. Exiting so the process can be restarted.');
      process.exit(1);
    }

    // Transient DNS/network issues (e.g. SRV/TXT lookup timeouts) are common on
    // cold starts in some hosting environments — retry with a fixed backoff
    // instead of crashing the whole server on the first hiccup.
    await sleep(RETRY_DELAY_MS);
    return connectDB(attempt + 1);
  }
};

module.exports = connectDB;