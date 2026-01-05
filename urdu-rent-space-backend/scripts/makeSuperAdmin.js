const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function makeSuperAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = require('../src/models/User');
    
    const email = 'hamzakhan68485537@gmail.com';
    
    const user = await User.findOneAndUpdate(
      { email },
      { 
        isAdmin: true, 
        isSuperAdmin: true 
      },
      { new: true }
    );

    if (user) {
      console.log(`✅ User ${email} is now a Super Admin`);
      console.log(`   - isAdmin: ${user.isAdmin}`);
      console.log(`   - isSuperAdmin: ${user.isSuperAdmin}`);
    } else {
      console.log(`❌ User with email ${email} not found`);
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

makeSuperAdmin();
