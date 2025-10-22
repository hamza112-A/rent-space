# Urdu Rent Space Backend API

A comprehensive rental marketplace backend built with Node.js, Express, and MongoDB Atlas, specifically designed for the Pakistani market with Urdu language support.

## 🏗️ Architecture Overview

```
urdu-rent-space-backend/
├── src/
│   ├── config/           # Configuration files
│   │   └── database.js   # MongoDB connection
│   ├── controllers/      # Route controllers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── listingController.js
│   │   ├── bookingController.js
│   │   ├── paymentController.js
│   │   └── messageController.js
│   ├── middleware/       # Custom middleware
│   │   ├── auth.js       # Authentication middleware
│   │   ├── errorMiddleware.js
│   │   └── upload.js     # File upload middleware
│   ├── models/          # MongoDB models
│   │   ├── User.js
│   │   ├── Listing.js
│   │   ├── Booking.js
│   │   ├── Category.js
│   │   ├── Message.js
│   │   ├── Payment.js
│   │   └── Review.js
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── listingRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── paymentRoutes.js
│   │   └── messageRoutes.js
│   ├── services/        # Business logic services
│   │   ├── emailService.js
│   │   ├── smsService.js
│   │   ├── paymentService.js
│   │   ├── uploadService.js
│   │   └── notificationService.js
│   ├── utils/           # Utility functions
│   │   ├── errorResponse.js
│   │   ├── validation.js
│   │   ├── otpGenerator.js
│   │   └── helpers.js
│   ├── validators/      # Request validation schemas
│   ├── jobs/            # Background jobs
│   ├── sockets/         # Socket.io handlers
│   ├── templates/       # Email templates
│   └── server.js        # Main server file
├── uploads/             # Temporary file uploads
├── tests/               # Test files
├── scripts/             # Database scripts
├── docs/                # API documentation
├── .env.example         # Environment variables template
├── package.json
└── README.md
```

## 🚀 Features

### Core Features
- **Authentication & Authorization**: JWT-based auth with role management (owner/borrower/both)
- **User Management**: Complete profile management with verification system
- **Listing Management**: CRUD operations for rental listings with categories
- **Booking System**: Complete booking workflow with status management
- **Payment Integration**: JazzCash, Easypaisa, and Stripe integration
- **Real-time Messaging**: Socket.io powered chat system
- **File Upload**: Cloudinary integration for images and videos
- **Search & Filtering**: Advanced search with geolocation support
- **Notification System**: Email, SMS, and push notifications
- **Review & Rating**: Comprehensive review system for users and listings

### Security Features
- Rate limiting per IP and user
- Input validation and sanitization
- XSS protection
- MongoDB injection prevention
- Helmet security headers
- CORS configuration
- File upload security
- JWT token management with refresh tokens
- Account lockout after failed attempts

### Pakistani Market Features
- **Urdu Language Support**: Bilingual content support
- **Local Payment Gateways**: JazzCash and Easypaisa integration
- **Pakistani Phone Numbers**: +92 format validation
- **CNIC Validation**: Pakistani identity card validation
- **Local Cities**: Pre-configured Pakistani cities
- **PKR Currency**: Pakistani Rupee as primary currency

## 🛠️ Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **ODM**: Mongoose
- **Authentication**: JWT with refresh tokens
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **SMS**: Twilio
- **Payments**: Stripe, JazzCash, Easypaisa APIs
- **Real-time**: Socket.io
- **Validation**: Joi + Custom validators
- **Security**: Helmet, bcrypt, rate limiting
- **Testing**: Jest + Supertest

## 📊 Database Schema

### Collections Overview
1. **users** - User accounts, profiles, and verification status
2. **listings** - Rental listings with media and specifications
3. **bookings** - Booking requests, approvals, and status tracking
4. **categories** - Dynamic categories with subcategories and form fields
5. **conversations** - Chat conversations between users
6. **messages** - Individual chat messages
7. **payments** - Payment transactions and history
8. **reviews** - User and listing reviews with ratings
9. **notifications** - System notifications for users
10. **subscriptions** - User subscription plans and status

### Key Features of Models

#### User Model
- Complete profile management
- Multi-level verification (email, phone, ID, biometric)
- Role-based access (owner, borrower, both)
- Subscription management
- Security features (login attempts, account locking)
- Statistics and ratings

#### Listing Model
- Dynamic category-based specifications
- Multi-language support (English/Urdu)
- Geolocation with 2dsphere indexing
- Flexible pricing (hourly, daily, weekly, monthly)
- Availability management with blocked dates
- Media management with Cloudinary
- Advanced search capabilities

#### Booking Model
- Complete booking lifecycle management
- Flexible pricing calculations
- Extension requests
- Check-in/check-out tracking
- Damage reporting
- Cancellation with refund calculations

## 🔐 Security Implementation

### Authentication Flow
1. User registration with email/phone verification
2. JWT access token (7 days) + refresh token (30 days)
3. Role-based authorization
4. Account verification levels
5. Password reset with secure tokens

### Data Protection
- All passwords hashed with bcrypt (12 rounds)
- Input validation on all endpoints
- XSS and injection attack prevention
- Rate limiting (100 requests/15 minutes)
- File upload restrictions and validation
- Secure cookie handling

### API Security
- CORS policy enforcement
- Helmet security headers
- MongoDB sanitization
- Parameter pollution prevention
- Request size limits
- Error message sanitization

## 📱 API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /verify-otp` - OTP verification
- `POST /resend-otp` - Resend OTP
- `POST /refresh` - Refresh access token
- `POST /logout` - User logout
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Reset password
- `GET /me` - Get current user

### Users (`/api/v1/users`)
- `GET /profile` - Get user profile
- `PATCH /profile` - Update profile
- `POST /verification/id` - Upload ID document
- `POST /verification/biometric` - Upload biometric data
- `GET /:id` - Get public profile
- `GET /:id/reviews` - Get user reviews
- `POST /:id/reviews` - Add user review

### Listings (`/api/v1/listings`)
- `POST /` - Create listing
- `GET /search` - Search listings
- `GET /my` - Get user's listings
- `GET /favorites` - Get favorite listings
- `GET /:id` - Get listing details
- `PATCH /:id` - Update listing
- `DELETE /:id` - Delete listing
- `POST /:id/favorite` - Toggle favorite
- `GET /:id/similar` - Get similar listings
- `GET /:id/availability` - Check availability
- `PATCH /:id/availability` - Update availability

### Bookings (`/api/v1/bookings`)
- `POST /` - Create booking
- `GET /` - Get user bookings
- `GET /:id` - Get booking details
- `POST /:id/approve` - Approve booking
- `POST /:id/reject` - Reject booking
- `POST /:id/cancel` - Cancel booking
- `POST /:id/complete` - Complete booking
- `POST /:id/extend` - Request extension

### Payments (`/api/v1/payments`)
- `POST /initiate` - Initiate payment
- `GET /:id/verify` - Verify payment
- `GET /history` - Payment history
- `POST /:id/refund` - Request refund

### Categories (`/api/v1/categories`)
- `GET /` - Get all categories
- `GET /:id` - Get category details
- `GET /:id/subcategories` - Get subcategories
- `GET /fields/:subcategoryId` - Get form fields

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ installed
- MongoDB Atlas account
- Cloudinary account
- Twilio account (for SMS)
- Email service (Gmail/SMTP)

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd urdu-rent-space-backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Required Environment Variables**
   ```env
   # Database
   MONGODB_URI=mongodb+srv://...
   
   # JWT
   JWT_SECRET=your-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret
   
   # Email
   EMAIL_HOST=smtp.gmail.com
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # SMS (Twilio)
   TWILIO_ACCOUNT_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   
   # File Upload (Cloudinary)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # Payment Gateways
   STRIPE_SECRET_KEY=sk_test_...
   JAZZCASH_MERCHANT_ID=your-merchant-id
   EASYPAISA_STORE_ID=your-store-id
   ```

4. **Database Setup**
   ```bash
   npm run seed  # Seed initial data (categories, admin user)
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Production Start**
   ```bash
   npm start
   ```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

## 📈 Monitoring & Health Checks

### Health Check Endpoint
```
GET /health
```

Returns server status, uptime, and environment info.

### Logging
- Request/response logging with Morgan
- Error logging with stack traces in development
- Structured logging for production

### Performance Monitoring
- Database query optimization
- Response time tracking
- Memory usage monitoring
- Rate limiting metrics

## 🔄 Background Jobs

- Email queue processing
- SMS delivery tracking
- Payment status updates
- Booking reminders
- Data cleanup tasks
- Analytics processing

## 📚 API Documentation

- Swagger/OpenAPI documentation available at `/docs`
- Postman collection included
- Request/response examples
- Error code documentation

## 🌍 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] SSL certificates installed
- [ ] Rate limiting configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] CDN configured for file uploads

### Recommended Hosting
- **Server**: DigitalOcean, AWS EC2, or Heroku
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary
- **CDN**: Cloudflare
- **Monitoring**: New Relic or DataDog

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📞 Support

For technical support:
- Email: tech@urdurental.pk
- Documentation: `/docs`
- Health Check: `/health`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for the Pakistani rental market**