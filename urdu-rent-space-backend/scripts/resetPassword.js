#!/usr/bin/env node

/**
 * Password Reset Script
 * This script allows you to reset a user's password directly in MongoDB
 * 
 * Usage:
 *   node scripts/resetPassword.js <email> <newPassword>
 * 
 * Example:
 *   node scripts/resetPassword.js superadmin@urdorentspace.com Admin@123
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('\n❌ Error: Missing required arguments');
  console.log('\nUsage:');
  console.log('  node scripts/resetPassword.js <email> <newPassword>');
  console.log('\nExample:');
  console.log('  node scripts/resetPassword.js superadmin@urdorentspace.com Admin@123');
  process.exit(1);
}

const [email, newPassword] = args;

// Validate password strength
if (newPassword.length < 8) {
  console.error('\n❌ Error: Password must be at least 8 characters long');
  process.exit(1);
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Reset password function
const resetPassword = async () => {
  try {
    await connectDB();

    // Get the User model
    const User = mongoose.model('User');

    // Find user by email
    console.log(`🔍 Looking for user with email: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`\n❌ User not found with email: ${email}`);
      process.exit(1);
    }

    console.log(`✅ User found: ${user.fullName} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Is Admin: ${user.isAdmin}`);
    console.log(`   Is Super Admin: ${user.isSuperAdmin}`);

    // Hash the new password
    console.log('\n🔐 Hashing new password...');
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password directly (bypassing the pre-save hook)
    const result = await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
          loginAttempts: 0
        },
        $unset: { lockUntil: 1 }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('\n✅ Password reset successful!');
      console.log('\n📋 New Credentials:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${newPassword}`);
      console.log('\n⚠️  Please save these credentials securely and delete this output.');
      console.log('💡 It\'s recommended to change the password after first login.\n');
    } else {
      console.error('\n❌ Password reset failed - no changes made');
    }

  } catch (error) {
    console.error('\n❌ Error resetting password:', error.message);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed\n');
    process.exit(0);
  }
};

// Run the script
resetPassword();
