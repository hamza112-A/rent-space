const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send SMS message
 * @param {Object} options - SMS options
 * @returns {Promise<Object>} Send result
 */
const sendSMS = async (options) => {
  try {
    const { to, message, from } = options;

    if (!to || !message) {
      throw new Error('Phone number and message are required');
    }

    const result = await client.messages.create({
      body: message,
      from: from || process.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    console.log('SMS sent successfully:', {
      to: to,
      sid: result.sid,
      status: result.status
    });

    return {
      success: true,
      sid: result.sid,
      status: result.status,
      to: result.to,
      from: result.from
    };

  } catch (error) {
    console.error('SMS sending failed:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Send OTP via SMS
 * @param {string} phone - Phone number
 * @param {string} otp - OTP code
 * @returns {Promise<Object>} Send result
 */
const sendOTP = async (phone, otp) => {
  const message = `Your Urdu Rent Space verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
  
  return sendSMS({
    to: phone,
    message: message
  });
};

/**
 * Send booking notification SMS
 * @param {string} phone - Phone number
 * @param {Object} booking - Booking object
 * @param {string} type - Notification type
 * @returns {Promise<Object>} Send result
 */
const sendBookingNotification = async (phone, booking, type) => {
  let message;

  switch (type) {
    case 'new_request':
      message = `New booking request for "${booking.listing.title}" from ${booking.renter.fullName}. Check your dashboard to respond.`;
      break;
    case 'approved':
      message = `Your booking for "${booking.listing.title}" has been approved! Booking ID: ${booking.bookingId}`;
      break;
    case 'rejected':
      message = `Your booking request for "${booking.listing.title}" has been rejected. Booking ID: ${booking.bookingId}`;
      break;
    case 'cancelled':
      message = `Booking ${booking.bookingId} for "${booking.listing.title}" has been cancelled.`;
      break;
    case 'reminder':
      message = `Reminder: Your booking for "${booking.listing.title}" starts tomorrow. Booking ID: ${booking.bookingId}`;
      break;
    default:
      message = `Update on your booking ${booking.bookingId} for "${booking.listing.title}".`;
  }

  return sendSMS({
    to: phone,
    message: message
  });
};

/**
 * Send payment confirmation SMS
 * @param {string} phone - Phone number
 * @param {Object} payment - Payment object
 * @returns {Promise<Object>} Send result
 */
const sendPaymentConfirmation = async (phone, payment) => {
  const message = `Payment of ${payment.currency} ${payment.amount} received successfully. Transaction ID: ${payment.transactionId}. Thank you!`;
  
  return sendSMS({
    to: phone,
    message: message
  });
};

/**
 * Send welcome SMS
 * @param {string} phone - Phone number
 * @param {string} fullName - User's full name
 * @returns {Promise<Object>} Send result
 */
const sendWelcomeSMS = async (phone, fullName) => {
  const message = `Welcome to Urdu Rent Space, ${fullName}! Start exploring rentals or list your items. Download our app for the best experience.`;
  
  return sendSMS({
    to: phone,
    message: message
  });
};

/**
 * Send security alert SMS
 * @param {string} phone - Phone number
 * @param {string} alertType - Type of security alert
 * @returns {Promise<Object>} Send result
 */
const sendSecurityAlert = async (phone, alertType) => {
  let message;

  switch (alertType) {
    case 'login':
      message = 'New login detected on your Urdu Rent Space account. If this wasn\'t you, please secure your account immediately.';
      break;
    case 'password_change':
      message = 'Your Urdu Rent Space password has been changed successfully. If you didn\'t make this change, contact support immediately.';
      break;
    case 'suspicious_activity':
      message = 'Suspicious activity detected on your account. Please review your account security settings.';
      break;
    default:
      message = 'Security alert for your Urdu Rent Space account. Please check your account.';
  }

  return sendSMS({
    to: phone,
    message: message
  });
};

/**
 * Send bulk SMS to multiple recipients
 * @param {Array} recipients - Array of phone numbers
 * @param {string} message - Message to send
 * @returns {Promise<Array>} Array of send results
 */
const sendBulkSMS = async (recipients, message) => {
  const promises = recipients.map(phone => 
    sendSMS({ to: phone, message })
      .catch(error => ({
        success: false,
        phone: phone,
        error: error.message
      }))
  );

  return Promise.all(promises);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
const validatePhoneNumber = (phone) => {
  // Pakistani phone number format: +92xxxxxxxxxx
  const phoneRegex = /^\+92[0-9]{10}$/;
  return phoneRegex.test(phone);
};

/**
 * Format phone number to international format
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If starts with 92, add +
  if (cleaned.startsWith('92') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  
  // If starts with 0, replace with +92
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '+92' + cleaned.substring(1);
  }
  
  // If 10 digits, assume it's without country code
  if (cleaned.length === 10) {
    return '+92' + cleaned;
  }
  
  return phone; // Return as is if can't format
};

/**
 * Get SMS delivery status
 * @param {string} messageSid - Twilio message SID
 * @returns {Promise<Object>} Delivery status
 */
const getSMSStatus = async (messageSid) => {
  try {
    const message = await client.messages(messageSid).fetch();
    
    return {
      success: true,
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      dateCreated: message.dateCreated,
      dateSent: message.dateSent,
      dateUpdated: message.dateUpdated
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Test SMS configuration
 * @returns {Promise<Object>} Test result
 */
const testSMSConfig = async () => {
  try {
    // Test by fetching account info
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    
    return {
      success: true,
      message: 'SMS configuration is valid',
      accountSid: account.sid,
      status: account.status
    };
  } catch (error) {
    return {
      success: false,
      message: `SMS configuration error: ${error.message}`
    };
  }
};

module.exports = {
  sendSMS,
  sendOTP,
  sendBookingNotification,
  sendPaymentConfirmation,
  sendWelcomeSMS,
  sendSecurityAlert,
  sendBulkSMS,
  validatePhoneNumber,
  formatPhoneNumber,
  getSMSStatus,
  testSMSConfig
};