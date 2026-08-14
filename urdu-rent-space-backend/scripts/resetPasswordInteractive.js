#!/usr/bin/env node

/**
 * Interactive Password Reset Script
 * This script provides an interactive prompt to reset a user's password
 * 
 * Usage:
 *   node scripts/resetPasswordInteractive.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility function to ask questions
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

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

// Main function
const main = async () => {
  try {
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║    🔐 Password Reset Utility Tool 🔐      ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    await connectDB();

    // Get user email
    const email = await question('Enter user email: ');
    
    if (!email || !email.includes('@')) {
      console.error('\n❌ Invalid email address');
      process.exit(1);
    }

    // Get the User model
    const User = mongoose.model('User');

    // Find user
    console.log(`\n🔍 Searching for user...`);
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`\n❌ User not found with email: ${email}`);
      process.exit(1);
    }

    // Display user info
    console.log('\n✅ User found:');
    console.log('─────────────────────────────────────────');
    console.log(`📧 Email:        ${user.email}`);
    console.log(`👤 Name:         ${user.fullName}`);
    console.log(`📱 Phone:        ${user.phone}`);
    console.log(`🎭 Role:         ${user.role}`);
    console.log(`👮 Admin:        ${user.isAdmin ? 'Yes' : 'No'}`);
    console.log(`⭐ Super Admin:  ${user.isSuperAdmin ? 'Yes' : 'No'}`);
    console.log(`📊 Status:       ${user.status}`);
    console.log('─────────────────────────────────────────\n');

    // Confirm
    const confirm = await question('Do you want to reset this user\'s password? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('\n❌ Password reset cancelled');
      process.exit(0);
    }

    // Get new password
    const newPassword = await question('\nEnter new password (min 8 characters): ');
    
    if (newPassword.length < 8) {
      console.error('\n❌ Password must be at least 8 characters long');
      process.exit(1);
    }

    const confirmPassword = await question('Confirm new password: ');
    
    if (newPassword !== confirmPassword) {
      console.error('\n❌ Passwords do not match');
      process.exit(1);
    }

    // Hash password
    console.log('\n🔐 Hashing password...');
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    console.log('💾 Updating password in database...');
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
      console.log('\n╔═══════════════════════════════════════════╗');
      console.log('║         ✅ Password Reset Success!        ║');
      console.log('╚═══════════════════════════════════════════╝\n');
      console.log('📋 Login Credentials:');
      console.log(`   📧 Email:    ${email}`);
      console.log(`   🔑 Password: ${newPassword}`);
      console.log('\n⚠️  Security Notes:');
      console.log('   • Save these credentials securely');
      console.log('   • Clear your terminal history');
      console.log('   • Change password after first login');
      console.log('   • Login attempts have been reset\n');
    } else {
      console.error('\n❌ Password reset failed - no changes made');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('🔌 Connection closed\n');
    process.exit(0);
  }
};

// Run the script
main();
