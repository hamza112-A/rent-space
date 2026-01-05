const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Load email template
 * @param {string} templateName - Name of the template file
 * @param {Object} data - Data to replace in template
 * @returns {Promise<string>} Rendered template
 */
const loadTemplate = async (templateName, data = {}) => {
  try {
    const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`);
    let template = await fs.readFile(templatePath, 'utf8');

    // Replace placeholders with actual data
    Object.keys(data).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(placeholder, data[key] || '');
    });

    // Replace common placeholders
    template = template.replace(/{{appName}}/g, 'Urdu Rent Space');
    template = template.replace(/{{appUrl}}/g, process.env.FRONTEND_URL);
    template = template.replace(/{{supportEmail}}/g, process.env.EMAIL_FROM);
    template = template.replace(/{{currentYear}}/g, new Date().getFullYear());

    return template;
  } catch (error) {
    console.error('Error loading email template:', error);
    // Return a basic template if file loading fails
    return `
      <html>
        <body>
          <h2>{{subject}}</h2>
          <p>{{message}}</p>
          <p>Best regards,<br>Urdu Rent Space Team</p>
        </body>
      </html>
    `.replace(/{{subject}}/g, data.subject || 'Notification')
     .replace(/{{message}}/g, data.message || 'Thank you for using our service.');
  }
};

/**
 * Send email
 * @param {Object} options - Email options
 * @returns {Promise<Object>} Send result
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    let html = options.html;

    // If template is specified, load and render it
    if (options.template) {
      html = await loadTemplate(options.template, options.data || {});
    }

    const mailOptions = {
      from: `"Urdu Rent Space" <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: html,
      attachments: options.attachments || []
    };

    // Add CC and BCC if provided
    if (options.cc) mailOptions.cc = options.cc;
    if (options.bcc) mailOptions.bcc = options.bcc;

    const result = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', {
      to: options.to,
      subject: options.subject,
      messageId: result.messageId
    });

    return {
      success: true,
      messageId: result.messageId,
      response: result.response
    };

  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send welcome email
 * @param {Object} user - User object
 * @returns {Promise<Object>} Send result
 */
const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Urdu Rent Space!',
    template: 'welcome',
    data: {
      fullName: user.fullName,
      email: user.email,
      loginUrl: `${process.env.FRONTEND_URL}/login`
    }
  });
};

/**
 * Send email verification
 * @param {Object} user - User object
 * @param {string} otp - Verification OTP
 * @returns {Promise<Object>} Send result
 */
const sendEmailVerification = async (user, otp) => {
  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email - Urdu Rent Space',
    template: 'emailVerification',
    data: {
      fullName: user.fullName,
      otp: otp,
      expiresIn: '10 minutes'
    }
  });
};

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} resetUrl - Password reset URL
 * @returns {Promise<Object>} Send result
 */
const sendPasswordResetEmail = async (user, resetUrl) => {
  return sendEmail({
    to: user.email,
    subject: 'Password Reset Request - Urdu Rent Space',
    template: 'passwordReset',
    data: {
      fullName: user.fullName,
      resetUrl: resetUrl,
      expiresIn: '10 minutes'
    }
  });
};

/**
 * Send booking confirmation email
 * @param {Object} booking - Booking object
 * @returns {Promise<Object>} Send result
 */
const sendBookingConfirmation = async (booking) => {
  const { renter, owner, listing } = booking;

  // Send to renter
  const renterEmail = sendEmail({
    to: renter.email,
    subject: 'Booking Confirmation - Urdu Rent Space',
    template: 'bookingConfirmation',
    data: {
      fullName: renter.fullName,
      bookingId: booking.bookingId,
      listingTitle: listing.title,
      startDate: booking.startDate.toLocaleDateString(),
      endDate: booking.endDate.toLocaleDateString(),
      totalAmount: booking.pricing.totalAmount,
      currency: booking.pricing.currency,
      ownerName: owner.fullName,
      ownerPhone: owner.phone
    }
  });

  // Send to owner
  const ownerEmail = sendEmail({
    to: owner.email,
    subject: 'New Booking Request - Urdu Rent Space',
    template: 'newBookingRequest',
    data: {
      fullName: owner.fullName,
      bookingId: booking.bookingId,
      listingTitle: listing.title,
      startDate: booking.startDate.toLocaleDateString(),
      endDate: booking.endDate.toLocaleDateString(),
      totalAmount: booking.pricing.totalAmount,
      currency: booking.pricing.currency,
      renterName: renter.fullName,
      renterPhone: renter.phone,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
    }
  });

  return Promise.all([renterEmail, ownerEmail]);
};

/**
 * Send booking status update email
 * @param {Object} booking - Booking object
 * @param {string} status - New status
 * @returns {Promise<Object>} Send result
 */
const sendBookingStatusUpdate = async (booking, status) => {
  const { renter, listing } = booking;

  let subject, template;

  switch (status) {
    case 'approved':
      subject = 'Booking Approved - Urdu Rent Space';
      template = 'bookingApproved';
      break;
    case 'rejected':
      subject = 'Booking Rejected - Urdu Rent Space';
      template = 'bookingRejected';
      break;
    case 'cancelled':
      subject = 'Booking Cancelled - Urdu Rent Space';
      template = 'bookingCancelled';
      break;
    default:
      subject = 'Booking Update - Urdu Rent Space';
      template = 'bookingUpdate';
  }

  return sendEmail({
    to: renter.email,
    subject: subject,
    template: template,
    data: {
      fullName: renter.fullName,
      bookingId: booking.bookingId,
      listingTitle: listing.title,
      status: status,
      startDate: booking.startDate.toLocaleDateString(),
      endDate: booking.endDate.toLocaleDateString(),
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
    }
  });
};

/**
 * Send payment confirmation email
 * @param {Object} payment - Payment object
 * @returns {Promise<Object>} Send result
 */
const sendPaymentConfirmation = async (payment) => {
  const { user, booking } = payment;

  return sendEmail({
    to: user.email,
    subject: 'Payment Confirmation - Urdu Rent Space',
    template: 'paymentConfirmation',
    data: {
      fullName: user.fullName,
      transactionId: payment.transactionId,
      amount: payment.amount,
      currency: payment.currency,
      bookingId: booking.bookingId,
      paymentMethod: payment.method,
      paidAt: payment.createdAt.toLocaleDateString()
    }
  });
};

/**
 * Send notification email
 * @param {Object} user - User object
 * @param {Object} notification - Notification object
 * @returns {Promise<Object>} Send result
 */
const sendNotificationEmail = async (user, notification) => {
  return sendEmail({
    to: user.email,
    subject: notification.title,
    template: 'notification',
    data: {
      fullName: user.fullName,
      title: notification.title,
      message: notification.body,
      actionUrl: notification.actionUrl || `${process.env.FRONTEND_URL}/dashboard`,
      actionText: notification.actionText || 'View Dashboard'
    }
  });
};

/**
 * Test email configuration
 * @returns {Promise<Object>} Test result
 */
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    return {
      success: true,
      message: 'Email configuration is valid'
    };
  } catch (error) {
    return {
      success: false,
      message: `Email configuration error: ${error.message}`
    };
  }
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendBookingConfirmation,
  sendBookingStatusUpdate,
  sendPaymentConfirmation,
  sendNotificationEmail,
  testEmailConfig
};