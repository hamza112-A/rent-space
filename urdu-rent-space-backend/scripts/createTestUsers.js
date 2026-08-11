const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User Schema (simplified version)
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['owner', 'borrower', 'both', 'admin', 'superadmin'],
    default: 'both'
  },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const testUsers = [
  {
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '+923001234567',
    password: 'Test123456',
    role: 'both',
    isAdmin: false,
    isSuperAdmin: false,
    verification: {
      email: { verified: true, verifiedAt: new Date() },
      phone: { verified: true, verifiedAt: new Date() }
    }
  },
  {
    fullName: 'Admin User',
    email: 'admin@urdorentspace.com',
    phone: '+923009876543',
    password: 'Admin123456',
    role: 'both',
    isAdmin: true,
    isSuperAdmin: false,
    verification: {
      email: { verified: true, verifiedAt: new Date() },
      phone: { verified: true, verifiedAt: new Date() }
    }
  },
  {
    fullName: 'Super Admin',
    email: 'superadmin@urdorentspace.com',
    phone: '+923007654321',
    password: 'SuperAdmin123',
    role: 'both',
    isAdmin: true,
    isSuperAdmin: true,
    verification: {
      email: { verified: true, verifiedAt: new Date() },
      phone: { verified: true, verifiedAt: new Date() }
    }
  },
  {
    fullName: 'Owner Test',
    email: 'owner@example.com',
    phone: '+923005551234',
    password: 'Owner123456',
    role: 'owner',
    isAdmin: false,
    isSuperAdmin: false,
    verification: {
      email: { verified: true, verifiedAt: new Date() },
      phone: { verified: true, verifiedAt: new Date() }
    }
  },
  {
    fullName: 'Borrower Test',
    email: 'borrower@example.com',
    phone: '+923005554321',
    password: 'Borrower123',
    role: 'borrower',
    isAdmin: false,
    isSuperAdmin: false,
    verification: {
      email: { verified: true, verifiedAt: new Date() },
      phone: { verified: true, verifiedAt: new Date() }
    }
  }
];

async function createTestUsers() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Clear existing test users (optional)
    const testEmails = testUsers.map(u => u.email);
    await User.deleteMany({ email: { $in: testEmails } });
    console.log('🗑️  Cleared existing test users\n');

    // Create users
    console.log('👥 Creating test users...\n');
    
    for (const userData of testUsers) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });

      console.log(`✅ Created: ${user.fullName}`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Password: ${userData.password}`);
      console.log(`   Role: ${user.role}\n`);
    }

    console.log('\n🎉 All test users created successfully!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 TEST CREDENTIALS SUMMARY:');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('REGULAR USER - Test User');
    console.log('  Email: test@example.com');
    console.log('  Password: Test123456');
    console.log('  Role: Both (Owner & Borrower)\n');
    
    console.log('ADMIN - Admin User');
    console.log('  Email: admin@urdorentspace.com');
    console.log('  Password: Admin123456');
    console.log('  Role: Both + Admin Access\n');
    
    console.log('SUPER ADMIN - Super Admin');
    console.log('  Email: superadmin@urdorentspace.com');
    console.log('  Password: SuperAdmin123');
    console.log('  Role: Both + Super Admin Access\n');
    
    console.log('OWNER - Owner Test');
    console.log('  Email: owner@example.com');
    console.log('  Password: Owner123456');
    console.log('  Role: Owner Only\n');
    
    console.log('BORROWER - Borrower Test');
    console.log('  Email: borrower@example.com');
    console.log('  Password: Borrower123');
    console.log('  Role: Borrower Only\n');
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n💡 You can now login with any of these credentials!');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
    
    if (error.code === 11000) {
      console.log('\n⚠️  Some users already exist. Try deleting them first or use different emails.');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit();
  }
}

// Run the script
createTestUsers();
