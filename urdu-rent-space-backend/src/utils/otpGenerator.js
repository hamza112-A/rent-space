const crypto = require('crypto');

/**
 * Generate a random OTP
 * @param {number} length - Length of OTP (default: 6)
 * @param {boolean} numbersOnly - Generate numbers only (default: true)
 * @returns {string} Generated OTP
 */
const generateOTP = (length = 6, numbersOnly = true) => {
  if (numbersOnly) {
    // Generate numeric OTP
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10);
    }
    return otp;
  } else {
    // Generate alphanumeric OTP
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += chars[Math.floor(Math.random() * chars.length)];
    }
    return otp;
  }
};

/**
 * Generate a secure random token
 * @param {number} bytes - Number of bytes (default: 32)
 * @returns {string} Generated token
 */
const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Generate a verification code for email/phone
 * @returns {string} 6-digit verification code
 */
const generateVerificationCode = () => {
  return generateOTP(6, true);
};

/**
 * Generate a booking reference
 * @returns {string} Booking reference
 */
const generateBookingReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `BK${timestamp}${random}`;
};

/**
 * Generate a transaction ID
 * @returns {string} Transaction ID
 */
const generateTransactionId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `TXN${timestamp}${random}`;
};

module.exports = {
  generateOTP,
  generateToken,
  generateVerificationCode,
  generateBookingReference,
  generateTransactionId
};