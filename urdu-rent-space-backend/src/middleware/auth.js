const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in cookies first (HTTP-only cookie)
  if (req.cookies.accessToken && req.cookies.accessToken !== 'none') {
    token = req.cookies.accessToken;
  }
  // Fallback to Authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorResponse('No user found with this token', 404));
    }

    // Check if user account is active
    if (user.status !== 'active') {
      return next(new ErrorResponse('Account is not active', 403));
    }

    // Check if user changed password after the token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return next(new ErrorResponse('User recently changed password. Please log in again.', 401));
    }

    // Update last active timestamp
    user.updateLastActive();

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    // Check if any of the required roles match
    const hasRequiredRole = roles.some(role => {
      if (role === 'superadmin') return req.user.isSuperAdmin;
      if (role === 'admin') return req.user.isAdmin || req.user.isSuperAdmin;
      return req.user.role === role;
    });

    if (!hasRequiredRole) {
      return next(new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403));
    }

    next();
  };
};

// Owner only access (can create listings, manage rentals)
// Roles: 'owner' or 'both' can access
const ownerOnly = (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  const allowedRoles = ['owner', 'both'];
  if (!allowedRoles.includes(req.user.role) && !req.user.isAdmin) {
    return next(new ErrorResponse('Only owners can perform this action. Please update your account role to become an owner.', 403));
  }

  next();
};

// Borrower only access (can book/rent items)
// Roles: 'borrower' or 'both' can access
const borrowerOnly = (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  const allowedRoles = ['borrower', 'both'];
  if (!allowedRoles.includes(req.user.role) && !req.user.isAdmin) {
    return next(new ErrorResponse('Only borrowers can perform this action.', 403));
  }

  next();
};

// Admin only access
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  if (!req.user.isAdmin) {
    return next(new ErrorResponse('Admin access required', 403));
  }

  next();
};

// Super admin only access
const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  if (!req.user.isSuperAdmin) {
    return next(new ErrorResponse('Super admin access required', 403));
  }

  next();
};

// Verify user owns resource or is admin
const ownerOrAdmin = (resourceModel, resourceIdParam = 'id') => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[resourceIdParam];
    
    if (!resourceId) {
      return next(new ErrorResponse('Resource ID is required', 400));
    }

    // Admin can access any resource
    if (req.user.isAdmin) {
      return next();
    }

    // Find the resource
    const resource = await resourceModel.findById(resourceId);

    if (!resource) {
      return next(new ErrorResponse('Resource not found', 404));
    }

    // Check if user owns the resource
    const ownerField = resource.owner || resource.user || resource.renter;
    
    if (!ownerField || ownerField.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to access this resource', 403));
    }

    // Attach resource to request for use in controller
    req.resource = resource;
    next();
  });
};

// Verify email is verified
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  if (!req.user.verification.email.verified) {
    return next(new ErrorResponse('Email verification required to access this route', 403));
  }

  next();
};

// Verify phone is verified
const requirePhoneVerification = (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  if (!req.user.verification.phone.verified) {
    return next(new ErrorResponse('Phone verification required to access this route', 403));
  }

  next();
};

// Verify full verification (email + phone + ID)
const requireFullVerification = (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  if (!req.user.isFullyVerified) {
    return next(new ErrorResponse('Full account verification required to access this route', 403));
  }

  next();
};

// Check subscription status
const requireSubscription = (planType = 'premium') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    const subscription = req.user.subscription;

    if (subscription.plan !== planType || subscription.status !== 'active') {
      return next(new ErrorResponse(`${planType} subscription required to access this route`, 403));
    }

    // Check if subscription has expired
    if (subscription.endDate && subscription.endDate < new Date()) {
      return next(new ErrorResponse('Subscription has expired', 403));
    }

    next();
  };
};

// Rate limiting for specific users
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get user's request history
    let userRequests = requests.get(userId) || [];

    // Filter out old requests
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);

    // Check if user has exceeded limit
    if (userRequests.length >= maxRequests) {
      return next(new ErrorResponse('Too many requests. Please try again later.', 429));
    }

    // Add current request
    userRequests.push(now);
    requests.set(userId, userRequests);

    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in cookies first
  if (req.cookies.accessToken && req.cookies.accessToken !== 'none') {
    token = req.cookies.accessToken;
  }
  // Fallback to Authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token, continue without user
  if (!token) {
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id);

    if (user && user.status === 'active' && !user.changedPasswordAfter(decoded.iat)) {
      req.user = user;
      user.updateLastActive();
    }
  } catch (error) {
    // Token is invalid, but don't fail the request
    console.log('Optional auth token verification failed:', error.message);
  }

  next();
});

module.exports = {
  protect,
  authorize,
  ownerOnly,
  borrowerOnly,
  adminOnly,
  superAdminOnly,
  ownerOrAdmin,
  requireEmailVerification,
  requirePhoneVerification,
  requireFullVerification,
  requireSubscription,
  userRateLimit,
  optionalAuth
};