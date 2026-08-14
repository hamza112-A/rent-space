#!/usr/bin/env node

/**
 * Email Configuration Tester
 * Tests if email sending works with current credentials
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('📧 Testing Email Configuration...\n');
console.log('📋 Current Settings:');
console.log(`   Host: ${process.env.EMAIL_HOST}`);
console.log(`   Port: ${process.env.EMAIL_PORT}`);
console.log(`   User: ${process.env.EMAIL_USER}`);
console.log(`   Pass: ${process.env.EMAIL_PASS ? '****' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET'}`);
console.log(`   From: ${process.env.EMAIL_FROM}\n`);

const testEmail = async () => {
  try {
    console.log('⏳ Creating transporter...');
    
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('⏳ Verifying connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!\n');

    console.log('⏳ Sending test email...');
    const info = await transporter.sendMail({
      from: `"Urdu Rent Space" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: '🧪 Test Email - Urdu Rent Space',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">✅ Email Configuration Working!</h2>
          <p>This is a test email from your Urdu Rent Space backend.</p>
          <p><strong>If you're reading this, email sending is working correctly!</strong></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 14px;">
            Sent at: ${new Date().toLocaleString()}<br>
            From: ${process.env.EMAIL_FROM}
          </p>
        </div>
      `,
      text: 'Email configuration is working! This is a test email from Urdu Rent Space backend.'
    });

    console.log('✅ SUCCESS! Test email sent!\n');
    console.log('📧 Email Details:');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   To: ${process.env.EMAIL_USER}`);
    console.log(`   Response: ${info.response}\n`);
    console.log('📬 Check your inbox (and spam folder) for the test email!\n');
    
  } catch (error) {
    console.error('\n❌ EMAIL TEST FAILED\n');
    console.error('Error details:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    console.log('\n🔍 Troubleshooting Steps:\n');
    
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.log('⚠️  Authentication Failed');
      console.log('   Problem: Gmail is rejecting your credentials\n');
      console.log('   Solution:');
      console.log('   1. Enable 2-Step Verification on your Google account');
      console.log('   2. Go to: https://myaccount.google.com/apppasswords');
      console.log('   3. Generate a new App Password');
      console.log('   4. Copy the 16-character password (remove spaces!)');
      console.log('   5. Update EMAIL_PASS in your .env file');
      console.log('   6. Restart this test\n');
      console.log('   Example App Password: abcdefghijklmnop (16 chars, no spaces)\n');
    } else if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT') {
      console.log('⚠️  Connection Timeout');
      console.log('   1. Check your internet connection');
      console.log('   2. Check if firewall is blocking port 587');
      console.log('   3. Try disabling VPN if using one\n');
    } else if (error.code === 'ENOTFOUND') {
      console.log('⚠️  Cannot reach email server');
      console.log('   1. Check EMAIL_HOST in .env file');
      console.log('   2. Verify internet connection');
      console.log('   3. Check DNS settings\n');
    } else {
      console.log('⚠️  Unknown Error');
      console.log('   1. Double-check all EMAIL_* variables in .env');
      console.log('   2. Make sure EMAIL_USER and EMAIL_PASS are correct');
      console.log('   3. Try using a different email service (Mailtrap, SendGrid)\n');
    }
    
    console.log('📚 See EMAIL_SETUP_FIX.md for detailed instructions\n');
    process.exit(1);
  }
};

testEmail();
