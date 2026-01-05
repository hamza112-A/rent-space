const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');
const { generateOTP } = require('../utils/otpGenerator');
const { validateInput } = require('../utils/validation');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { fullName, email, phone, password, role } = req.body;

  // Validate input
  const validation = validateInput({
    fullName: { value: fullName, rules: ['required', 'string', 'max:100'] },
    email: { value: email, rules: ['required', 'email'] },
    phone: { value: phone, rules: ['required', 'phone'] },
    password: { value: password, rules: ['required', 'string', 'min:8'] },
    role: { value: role, rules: ['required', 'in:owner,borrower,both'] }
  });

  if (!validation.isValid) {
    return next(new ErrorResponse('Validation failed', 400, validation.errors));
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  });

  if (existingUser) {
    return next(new ErrorResponse('User already exists with this email or phone', 400));
  }

  // Create user
  const user = await User.create({
    fullName,
    email,
    phone,
    password,
    role
  });

  // Generate OTP for email and phone verification
  const emailOTP = generateOTP();
  const phoneOTP = generateOTP();

  // Set OTP in user document
  user.verification.email.token = emailOTP;
  user.verification.email.tokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  user.verification.phone.otp = phoneOTP;
  user.verification.phone.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await user.save({ validateBeforeSave: false });

  // Send verification emails and SMS
  try {
    await Promise.all([
      sendEmail({
        to: email,
        subject: 'Verify Your Email - Urdu Rent Space',
        template: 'emailVerification',
        data: {
          fullName,
          otp: emailOTP,
          expiresIn: '10 minutes'
        }
      }),
      sendSMS({
        to: phone,
        message: `Your Urdu Rent Space verification code is: ${phoneOTP}. Valid for 10 minutes.`
      })
    ]);
  } catch (error) {
    console.error('Failed to send verification messages:', error);
    // Don't fail registration if email/SMS fails
  }

  res.status(201).json({
    success: true,
    data: {
      userId: user._id,
      email: user.email,
      message: 'Registration successful. Please verify your email and phone number.',
      verificationRequired: {
        email: true,
        phone: true
      }
    }
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, phone, password } = req.body;

  // Validate input
  if (!password) {
    return next(new ErrorResponse('Password is required', 400));
  }

  if (!email && !phone) {
    return next(new ErrorResponse('Email or phone is required', 400));
  }

  // Find user by email or phone
  const query = email ? { email } : { phone };
  const user = await User.findOne(query).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if account is locked
  if (user.isLocked) {
    return next(new ErrorResponse('Account is temporarily locked due to too many failed login attempts', 423));
  }

  // Check if account is suspended or banned
  if (user.status === 'suspended') {
    return next(new ErrorResponse('Account is suspended', 403));
  }

  if (user.status === 'banned') {
    return next(new ErrorResponse('Account is banned', 403));
  }

  // Check password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    await user.incLoginAttempts();
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate tokens
  const accessToken = user.getSignedJwtToken();
  const refreshToken = user.generateRefreshToken();
  await user.save({ validateBeforeSave: false });

  // Cookie options
  const isProduction = process.env.NODE_ENV === 'production';
  
  const accessTokenOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/'
  };

  const refreshTokenOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/'
  };

  // Set tokens in HTTP-only cookies
  res.cookie('accessToken', accessToken, accessTokenOptions);
  res.cookie('refreshToken', refreshToken, refreshTokenOptions);

  res.status(200).json({
    success: true,
    data: {
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        profileImage: user.avatar?.url,
        isEmailVerified: user.verification?.email?.verified || false,
        isPhoneVerified: user.verification?.phone?.verified || false,
        isVerified: user.isFullyVerified,
        subscription: user.subscription
      }
    }
  });
});

// @desc    Verify OTP
// @route   POST /api/v1/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res, next) => {
  const { userId, otp, type } = req.body;

  // Validate input
  if (!userId || !otp || !type) {
    return next(new ErrorResponse('User ID, OTP, and type are required', 400));
  }

  if (!['email', 'phone'].includes(type)) {
    return next(new ErrorResponse('Type must be either email or phone', 400));
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const verification = user.verification[type];

  // Check if already verified
  if (verification.verified) {
    return next(new ErrorResponse(`${type} is already verified`, 400));
  }

  // Check OTP attempts for phone
  if (type === 'phone' && verification.attempts >= 5) {
    return next(new ErrorResponse('Too many OTP attempts. Please request a new OTP.', 429));
  }

  // Check OTP expiry
  const otpField = type === 'email' ? 'token' : 'otp';
  const expiryField = type === 'email' ? 'tokenExpires' : 'otpExpires';

  if (!verification[otpField] || verification[expiryField] < new Date()) {
    return next(new ErrorResponse('OTP has expired. Please request a new one.', 400));
  }

  // Verify OTP
  if (verification[otpField] !== otp) {
    if (type === 'phone') {
      verification.attempts += 1;
      await user.save({ validateBeforeSave: false });
    }
    return next(new ErrorResponse('Invalid OTP', 400));
  }

  // Mark as verified
  verification.verified = true;
  verification.verifiedAt = new Date();
  verification[otpField] = undefined;
  verification[expiryField] = undefined;
  
  if (type === 'phone') {
    verification.attempts = 0;
  }

  // Activate user if email is verified
  if (type === 'email') {
    user.status = 'active';
  }

  await user.save({ validateBeforeSave: false });

  // Generate tokens so user can log in after verification
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );

  // Cookie options
  const isProduction = process.env.NODE_ENV === 'production';
  
  const accessTokenOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/'
  };

  const refreshTokenOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/'
  };

  // Set tokens in HTTP-only cookies
  res.cookie('accessToken', accessToken, accessTokenOptions);
  res.cookie('refreshToken', refreshToken, refreshTokenOptions);

  res.status(200).json({
    success: true,
    data: {
      message: `${type} verified successfully`,
      verified: true,
      isFullyVerified: user.isFullyVerified,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.verification?.email?.verified || false,
        isPhoneVerified: user.verification?.phone?.verified || false,
      }
    }
  });
});

// @desc    Resend OTP
// @route   POST /api/v1/auth/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res, next) => {
  const { userId, type } = req.body;

  if (!userId || !type) {
    return next(new ErrorResponse('User ID and type are required', 400));
  }

  if (!['email', 'phone'].includes(type)) {
    return next(new ErrorResponse('Type must be either email or phone', 400));
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const verification = user.verification[type];

  // Check if already verified
  if (verification.verified) {
    return next(new ErrorResponse(`${type} is already verified`, 400));
  }

  // Generate new OTP
  const newOTP = generateOTP();
  const otpField = type === 'email' ? 'token' : 'otp';
  const expiryField = type === 'email' ? 'tokenExpires' : 'otpExpires';

  verification[otpField] = newOTP;
  verification[expiryField] = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  if (type === 'phone') {
    verification.attempts = 0;
  }

  await user.save({ validateBeforeSave: false });

  // Send OTP
  try {
    if (type === 'email') {
      await sendEmail({
        to: user.email,
        subject: 'Verify Your Email - Urdu Rent Space',
        template: 'emailVerification',
        data: {
          fullName: user.fullName,
          otp: newOTP,
          expiresIn: '10 minutes'
        }
      });
    } else {
      await sendSMS({
        to: user.phone,
        message: `Your Urdu Rent Space verification code is: ${newOTP}. Valid for 10 minutes.`
      });
    }
  } catch (error) {
    console.error('Failed to send OTP:', error);
    return next(new ErrorResponse('Failed to send OTP. Please try again.', 500));
  }

  res.status(200).json({
    success: true,
    data: {
      message: `OTP sent to ${type} successfully`,
      expiresIn: 10 * 60 // 10 minutes in seconds
    }
  });
});

// @desc    Select user role (after registration)
// @route   POST /api/v1/auth/select-role
// @access  Public
const selectRole = asyncHandler(async (req, res, next) => {
  const { userId, role } = req.body;

  if (!userId || !role) {
    return next(new ErrorResponse('User ID and role are required', 400));
  }

  if (!['owner', 'borrower', 'both'].includes(role)) {
    return next(new ErrorResponse('Invalid role selected', 400));
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      message: 'Role updated successfully',
      role: role
    }
  });
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (!token) {
    return next(new ErrorResponse('Refresh token is required', 401));
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(rt => rt.token === token);

    if (!tokenExists) {
      return next(new ErrorResponse('Invalid refresh token', 401));
    }

    // Generate new access token
    const accessToken = user.getSignedJwtToken();

    // Cookie options
    const isProduction = process.env.NODE_ENV === 'production';
    
    const accessTokenOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/'
    };

    // Set new access token in cookie
    res.cookie('accessToken', accessToken, accessTokenOptions);

    res.status(200).json({
      success: true,
      data: {
        expiresIn: 7 * 24 * 60 * 60
      }
    });

  } catch (error) {
    return next(new ErrorResponse('Invalid refresh token', 401));
  }
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (token) {
    // Remove refresh token from user's tokens
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== token);
      await user.save({ validateBeforeSave: false });
    }
  }

  // Clear both cookies
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    path: '/'
  };

  res.cookie('accessToken', 'none', cookieOptions);
  res.cookie('refreshToken', 'none', cookieOptions);

  res.status(200).json({
    success: true,
    data: {
      message: 'Logged out successfully'
    }
  });
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse('Email is required', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorResponse('User not found with this email', 404));
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Urdu Rent Space',
      template: 'passwordReset',
      data: {
        fullName: user.fullName,
        resetUrl,
        expiresIn: '10 minutes'
      }
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Password reset email sent successfully'
      }
    });

  } catch (error) {
    console.error('Failed to send password reset email:', error);
    
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return next(new ErrorResponse('Token and new password are required', 400));
  }

  if (newPassword.length < 8) {
    return next(new ErrorResponse('Password must be at least 8 characters', 400));
  }

  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired token', 400));
  }

  // Set new password
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();

  // Clear all refresh tokens (force re-login)
  user.refreshTokens = [];

  await user.save();

  res.status(200).json({
    success: true,
    data: {
      message: 'Password reset successfully. Please login with your new password.'
    }
  });
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // Transform user data for frontend
  const userData = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    profileImage: user.avatar?.url,
    bio: user.bio,
    location: user.location,
    isEmailVerified: user.verification?.email?.verified || false,
    isPhoneVerified: user.verification?.phone?.verified || false,
    isIdentityVerified: user.verification?.identity?.verified || false,
    verification: user.verification,
    subscription: user.subscription,
    stats: user.stats,
    rating: user.rating,
    preferences: user.preferences,
    createdAt: user.createdAt,
  };

  res.status(200).json({
    success: true,
    data: userData
  });
});

// @desc    Change password (for logged-in users)
// @route   POST /api/v1/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Current password and new password are required', 400));
  }

  if (newPassword.length < 8) {
    return next(new ErrorResponse('New password must be at least 8 characters', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  // Set new password
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      message: 'Password changed successfully'
    }
  });
});

// @desc    Delete user account
// @route   DELETE /api/v1/auth/delete-account
// @access  Private
const deleteAccount = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return next(new ErrorResponse('Password is required to delete account', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Verify password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  // Delete user (or mark as deleted)
  await User.findByIdAndDelete(req.user.id);

  // Clear cookies
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    path: '/'
  };

  res.cookie('accessToken', 'none', cookieOptions);
  res.cookie('refreshToken', 'none', cookieOptions);

  res.status(200).json({
    success: true,
    data: {
      message: 'Account deleted successfully'
    }
  });
});

// @desc    Setup 2FA - Generate secret and QR code
// @route   POST /api/v1/auth/2fa/setup
// @access  Private
const setup2FA = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+twoFactorAuth.secret');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (user.twoFactorAuth?.enabled) {
    return next(new ErrorResponse('2FA is already enabled', 400));
  }

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `UrduRentSpace:${user.email}`,
    length: 20
  });

  // Store secret temporarily (not enabled yet)
  user.twoFactorAuth = {
    enabled: false,
    secret: secret.base32,
    backupCodes: []
  };
  await user.save({ validateBeforeSave: false });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  res.status(200).json({
    success: true,
    data: {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: 'Scan the QR code with your authenticator app, then verify with a code'
    }
  });
});

// @desc    Verify and enable 2FA
// @route   POST /api/v1/auth/2fa/verify
// @access  Private
const verify2FA = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return next(new ErrorResponse('Verification token is required', 400));
  }

  const user = await User.findById(req.user.id).select('+twoFactorAuth.secret');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (!user.twoFactorAuth?.secret) {
    return next(new ErrorResponse('Please setup 2FA first', 400));
  }

  if (user.twoFactorAuth?.enabled) {
    return next(new ErrorResponse('2FA is already enabled', 400));
  }

  // Verify token
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorAuth.secret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps tolerance
  });

  if (!verified) {
    return next(new ErrorResponse('Invalid verification code', 400));
  }

  // Generate backup codes
  const backupCodes = [];
  for (let i = 0; i < 10; i++) {
    backupCodes.push({
      code: crypto.randomBytes(4).toString('hex').toUpperCase(),
      used: false
    });
  }

  // Enable 2FA
  user.twoFactorAuth.enabled = true;
  user.twoFactorAuth.backupCodes = backupCodes;
  user.twoFactorAuth.enabledAt = new Date();
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    data: {
      message: '2FA enabled successfully',
      backupCodes: backupCodes.map(bc => bc.code)
    }
  });
});

// @desc    Disable 2FA
// @route   POST /api/v1/auth/2fa/disable
// @access  Private
const disable2FA = asyncHandler(async (req, res, next) => {
  const { password, token } = req.body;

  if (!password) {
    return next(new ErrorResponse('Password is required', 400));
  }

  const user = await User.findById(req.user.id).select('+password +twoFactorAuth.secret');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (!user.twoFactorAuth?.enabled) {
    return next(new ErrorResponse('2FA is not enabled', 400));
  }

  // Verify password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  // Verify 2FA token if provided
  if (token) {
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorAuth.secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return next(new ErrorResponse('Invalid 2FA code', 400));
    }
  }

  // Disable 2FA
  user.twoFactorAuth = {
    enabled: false,
    secret: undefined,
    backupCodes: [],
    enabledAt: undefined
  };
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    data: {
      message: '2FA disabled successfully'
    }
  });
});

// @desc    Get 2FA status
// @route   GET /api/v1/auth/2fa/status
// @access  Private
const get2FAStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      enabled: user.twoFactorAuth?.enabled || false,
      enabledAt: user.twoFactorAuth?.enabledAt || null,
      backupCodesRemaining: user.twoFactorAuth?.backupCodes?.filter(bc => !bc.used).length || 0
    }
  });
});

// @desc    Regenerate backup codes
// @route   POST /api/v1/auth/2fa/backup-codes
// @access  Private
const regenerateBackupCodes = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return next(new ErrorResponse('Password is required', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (!user.twoFactorAuth?.enabled) {
    return next(new ErrorResponse('2FA is not enabled', 400));
  }

  // Verify password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  // Generate new backup codes
  const backupCodes = [];
  for (let i = 0; i < 10; i++) {
    backupCodes.push({
      code: crypto.randomBytes(4).toString('hex').toUpperCase(),
      used: false
    });
  }

  user.twoFactorAuth.backupCodes = backupCodes;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    data: {
      message: 'Backup codes regenerated',
      backupCodes: backupCodes.map(bc => bc.code)
    }
  });
});

module.exports = {
  register,
  login,
  verifyOTP,
  resendOTP,
  selectRole,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
  deleteAccount,
  setup2FA,
  verify2FA,
  disable2FA,
  get2FAStatus,
  regenerateBackupCodes
};