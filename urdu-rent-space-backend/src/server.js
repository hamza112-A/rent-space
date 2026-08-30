const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load environment variables
require('dotenv').config();

// Import configurations
const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const socketHandler = require('./sockets/socketHandler');
const Payment = require('./models/Payment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const listingRoutes = require('./routes/listingRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const earningsRoutes = require('./routes/earningsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const storefrontRoutes = require('./routes/storefrontRoutes');

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

// Stripe webhook: MUST be registered before express.json() below, since Stripe
// signature verification requires the raw, unparsed request body. If this were
// registered after express.json(), the body would already be parsed/consumed
// and signature verification would always fail.
app.post(`${API_PREFIX}/payments/webhook`, express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured; rejecting webhook request.');
    return res.status(500).send('Webhook not configured');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
      if (payment && payment.status !== 'completed') {
        payment.status = 'completed';
        payment.completedAt = new Date();
        payment.transactionId = paymentIntent.id;
        // The owner is owed the subtotal minus the platform's tiered
        // commission, not amount.total (which also includes the borrower's
        // service fee) — see Payment.ownerEarnings. The /payments/confirm
        // route usually sets this first when the client is present; this
        // webhook is the fallback path (e.g. the client closed the tab
        // before confirm ran) and must set it too.
        if (!payment.payout?.amount) {
          payment.payout = { amount: payment.ownerEarnings, status: 'pending' };
        }
        await payment.save();
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const failedPayment = event.data.object;
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: failedPayment.id },
        { status: 'failed' }
      );
      break;
    }
    default:
      console.log(`Unhandled Stripe event type ${event.type}`);
  }

  res.json({ received: true });
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // More lenient in development
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.ADMIN_FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:8080',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['category', 'subcategory', 'features', 'sort', 'fields']
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// One-time bootstrap: promote a user to superadmin, but only while zero
// superadmins exist yet. Self-locking — becomes permanently inert the
// moment any superadmin exists, so it can't be reused as a backdoor.
// TODO: remove this route once the first superadmin has been bootstrapped.
app.post(`${API_PREFIX}/system/bootstrap-superadmin`, express.json(), async (req, res) => {
  try {
    const User = require('./models/User');
    const existingSuperadmin = await User.countDocuments({ adminRole: 'superadmin' });
    if (existingSuperadmin > 0) {
      return res.status(403).json({ success: false, message: 'A superadmin already exists — bootstrap is disabled' });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.adminRole = 'superadmin';
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, data: { email: user.email, adminRole: user.adminRole } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API routes
app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/listings`, listingRoutes);
app.use(`${API_PREFIX}/bookings`, bookingRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/conversations`, messageRoutes);
app.use(`${API_PREFIX}/messages`, messageRoutes); // Alias for messages
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/subscriptions`, subscriptionRoutes);
app.use(`${API_PREFIX}/earnings`, earningsRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/disputes`, disputeRoutes);
app.use(`${API_PREFIX}/organizations`, organizationRoutes);
app.use(`${API_PREFIX}/storefront`, storefrontRoutes);

// Socket.IO connection handling
socketHandler(io);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Unhandled Rejection: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
🚀 Server running in ${process.env.NODE_ENV || 'development'} mode
📡 Port: ${PORT}
🌐 API: http://localhost:${PORT}${API_PREFIX}
📊 Health: http://localhost:${PORT}/health
🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
  `);
});

module.exports = { app, server, io };