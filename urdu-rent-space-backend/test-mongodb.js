#!/usr/bin/env node

/**
 * MongoDB Connection Tester
 * Tests if MongoDB Atlas connection works
 */

require('dotenv').config();
const mongoose = require('mongoose');

console.log('🧪 Testing MongoDB Connection...\n');
console.log('📋 Configuration:');
console.log(`   URI: ${process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
console.log(`   Cluster: cluster0.ydy8xtc.mongodb.net`);
console.log(`   Database: urdu-rent-space\n`);

const testConnection = async () => {
  let error = null;
  
  try {
    console.log('⏳ Attempting to connect...');
    
    const startTime = Date.now();
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
    });
    
    const duration = Date.now() - startTime;
    
    console.log('✅ SUCCESS! MongoDB connection established');
    console.log(`⏱️  Connection time: ${duration}ms`);
    console.log(`🌐 Connected to: ${mongoose.connection.host}`);
    console.log(`📦 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Connection state: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Unknown'}`);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📚 Collections found: ${collections.length}`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    console.log('\n✅ MongoDB is working correctly!\n');
    
  } catch (err) {
    error = err;
    console.error('\n❌ CONNECTION FAILED\n');
    console.error('Error details:');
    console.error(`   Message: ${err.message}`);
    console.error(`   Code: ${err.code || 'N/A'}`);
    console.error(`   Name: ${err.name}`);
    
    console.log('\n🔍 Troubleshooting Steps:\n');
    
    if (err.message.includes('ETIMEOUT') || err.message.includes('queryTxt')) {
      console.log('⚠️  Network timeout detected');
      console.log('   1. Check if your IP is whitelisted in MongoDB Atlas');
      console.log('   2. Go to: https://cloud.mongodb.com/');
      console.log('   3. Navigate to: Network Access');
      console.log('   4. Add your IP or allow 0.0.0.0/0 (all IPs)');
      console.log('   5. Wait 1-2 minutes and try again\n');
    } else if (err.message.includes('authentication failed')) {
      console.log('⚠️  Authentication issue detected');
      console.log('   1. Verify username and password in .env file');
      console.log('   2. Check MongoDB Atlas user permissions');
      console.log('   3. Try resetting the password in MongoDB Atlas\n');
    } else if (err.message.includes('ENOTFOUND')) {
      console.log('⚠️  DNS resolution failed');
      console.log('   1. Check your internet connection');
      console.log('   2. Try: ping cluster0.ydy8xtc.mongodb.net');
      console.log('   3. Disable VPN if using one');
      console.log('   4. Check firewall settings\n');
    } else {
      console.log('⚠️  Unknown error');
      console.log('   1. Check MongoDB Atlas cluster status');
      console.log('   2. Verify .env file has correct MONGODB_URI');
      console.log('   3. Check if cluster is paused or deleted\n');
    }
    
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Test completed. Connection closed.\n');
    process.exit(error ? 1 : 0);
  }
};

testConnection();
