# Urdu Rent Space - Complete Full Stack Application

A comprehensive rental marketplace application built for the Pakistani market with complete Urdu language support.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🏗️ Project Structure

```
mudassir/
├── urdu-rent-space/           # Frontend - React + TypeScript + Vite
├── urdu-rent-space-backend/   # Backend - Node.js + Express + MongoDB
└── README.md
```

## 🚀 Features Overview

### 🎨 Frontend (React + TypeScript)
- **Modern React Application**: Built with React 18 and TypeScript
- **Responsive Design**: Tailwind CSS with mobile-first approach
- **Bilingual Support**: Complete English/Urdu language switching
- **Advanced UI Components**: Shadcn/UI component library
- **Real-time Features**: Socket.io integration for live messaging
- **State Management**: React Query for server state management
- **Routing**: React Router with protected routes
- **Form Handling**: React Hook Form with Zod validation

### ⚡ Backend (Node.js + Express)
- **RESTful API**: Comprehensive API with 50+ endpoints
- **Authentication**: JWT with refresh tokens and multi-level verification
- **Database**: MongoDB Atlas with optimized schemas and indexing
- **File Management**: Cloudinary integration for images/videos
- **Real-time Communication**: Socket.io for instant messaging
- **Payment Processing**: JazzCash, Easypaisa, and Stripe integration
- **Notifications**: Email (Nodemailer) and SMS (Twilio) services
- **Security**: Rate limiting, input validation, XSS protection

## 🇵🇰 Pakistani Market Specialization

### Language & Localization
- **Complete Urdu Support**: All UI elements translated
- **RTL Layout Support**: Right-to-left text rendering
- **Cultural Adaptation**: Pakistani naming conventions and formats

### Local Integrations
- **Payment Gateways**: JazzCash and Easypaisa APIs
- **Phone Validation**: Pakistani mobile number formats (+92)
- **CNIC Validation**: National identity card verification
- **Currency**: Pakistani Rupee (PKR) with proper formatting
- **Cities**: Pre-configured Pakistani cities and areas

### Market-Specific Features
- **Local Business Hours**: Pakistani timezone support
- **Cultural Categories**: Pakistan-specific rental categories
- **Regional Pricing**: Area-based pricing suggestions
- **Local Regulations**: Compliance with Pakistani rental laws

## 🛠️ Technology Stack

### Frontend Technologies
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - High-quality component library
- **React Router** - Client-side routing
- **React Query** - Server state management
- **React Hook Form** - Performant form handling
- **Zod** - Schema validation
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client with interceptors

### Backend Technologies
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **Cloudinary** - Media management and optimization
- **Multer** - File upload handling
- **Sharp** - Image processing
- **Nodemailer** - Email service
- **Twilio** - SMS service
- **Socket.io** - Real-time bidirectional communication
- **Joi** - Data validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection

## 📱 Key Application Features

### User Management
- **Multi-role System**: Owner, Borrower, or Both
- **Verification Levels**: Email, Phone, ID Document, Biometric
- **Profile Management**: Complete user profiles with avatars
- **Account Security**: Login attempt tracking, account lockout
- **Subscription Plans**: Free and Premium tiers

### Listing Management
- **Dynamic Categories**: 8 main categories with subcategories
- **Rich Media**: Multiple images and videos per listing
- **Geolocation**: Map integration and location-based search
- **Flexible Pricing**: Hourly, daily, weekly, monthly rates
- **Availability Calendar**: Date blocking and availability management
- **Advanced Search**: Filters, sorting, and geolocation search

### Booking System
- **Complete Workflow**: Request → Approval → Payment → Completion
- **Status Tracking**: Real-time booking status updates
- **Extension Requests**: Booking duration extensions
- **Check-in/Check-out**: Digital verification process
- **Damage Reporting**: Post-rental condition reporting
- **Cancellation Management**: Flexible cancellation policies

### Payment Processing
- **Multiple Gateways**: JazzCash, Easypaisa, Stripe
- **Secure Transactions**: PCI compliance and fraud detection
- **Automatic Payouts**: Owner earnings management
- **Refund Processing**: Automated refund calculations
- **Transaction History**: Complete payment tracking
- **Multi-currency**: PKR and USD support

### Communication
- **Real-time Messaging**: Instant chat between users
- **Notification System**: Email, SMS, and push notifications
- **Booking Communications**: Automated booking updates
- **Review System**: User and listing reviews with ratings

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ installed
- MongoDB Atlas account
- Cloudinary account
- Twilio account (for SMS)
- Email service (Gmail/SMTP)

### Frontend Setup
```bash
cd urdu-rent-space
npm install
npm run dev
```
Access at: http://localhost:3000

### Backend Setup
```bash
cd urdu-rent-space-backend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```
API available at: http://localhost:3001

## 🔧 Configuration

### Backend Environment Variables
```env
# Database
MONGODB_URI=mongodb+srv://...

# Authentication
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# File Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Communications
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Payments
STRIPE_SECRET_KEY=sk_test_...
JAZZCASH_MERCHANT_ID=your-merchant-id
EASYPAISA_STORE_ID=your-store-id
```

### Frontend Environment Variables
```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

## 🔐 Security Features

### Authentication & Authorization
- JWT access tokens (7 days) + refresh tokens (30 days)
- Role-based access control (Owner/Borrower/Both)
- Multi-factor authentication (Email + Phone + ID + Biometric)
- Account lockout after failed attempts
- Secure password reset with time-limited tokens

### Data Protection
- Input validation and sanitization on all endpoints
- XSS attack prevention
- MongoDB injection protection
- Rate limiting (100 requests/15 minutes)
- File upload restrictions and validation
- CORS policy enforcement

### Privacy & Compliance
- Personal data encryption
- Secure file storage with Cloudinary
- GDPR-compliant data handling
- Account deletion and data retention policies

## 📊 Performance Optimizations

### Frontend
- Code splitting and lazy loading
- Image optimization and lazy loading
- Efficient state management with React Query
- Memoization of expensive computations
- Bundle size optimization

### Backend
- Database indexing for fast queries
- Query optimization and aggregation pipelines
- Caching strategies with Redis (planned)
- Image compression and optimization
- API response compression

## 🧪 Testing Strategy

### Frontend Testing
- Unit tests with Jest and React Testing Library
- Component testing for UI components
- Integration tests for user flows
- E2E tests with Cypress (planned)

### Backend Testing
- Unit tests for services and utilities
- Integration tests for API endpoints
- Authentication flow testing
- Payment gateway testing
- Database operation testing

## 📈 Monitoring & Analytics

### Application Monitoring
- Error tracking and reporting
- Performance monitoring
- User behavior analytics
- API usage statistics
- Real-time system health checks

### Business Analytics
- User registration and engagement metrics
- Listing performance analytics
- Booking conversion rates
- Revenue tracking and reporting
- Geographic usage patterns

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] SSL certificates installed
- [ ] CDN configured for static assets
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Rate limiting configured

### Recommended Infrastructure
- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront
- **Backend**: DigitalOcean, AWS EC2, or Heroku
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary
- **CDN**: Cloudflare
- **Monitoring**: New Relic, DataDog, or Sentry

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Contact

- **Email**: hamzakhan68485537@gmail.com
- **GitHub Issues**: For bug reports and feature requests
- **Documentation**: Comprehensive API docs available in `/backend/docs`

## 🙏 Acknowledgments

- **Shadcn/UI** for the beautiful component library
- **Tailwind CSS** for the utility-first CSS framework
- **MongoDB Atlas** for reliable cloud database hosting
- **Cloudinary** for powerful media management
- **Pakistani Developer Community** for inspiration and feedback

---

**Built with ❤️ for the Pakistani rental market by Hamza Khan**

*Empowering local businesses and individuals to share resources efficiently and securely.*