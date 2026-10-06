# Urdu Rent Space - Full Stack Rental Marketplace

A comprehensive bilingual (English/Urdu) rental marketplace platform for Pakistan, supporting multiple categories including properties, vehicles, clothes, equipment, services, and more.

## 🚀 Project Structure

```
mudassir/
├── urdu-rent-space/           # Frontend (React + TypeScript + Vite)
└── urdu-rent-space-backend/   # Backend (Node.js + Express + MongoDB)
```

## 📋 Prerequisites

- **Node.js** >= 16.0.0
- **npm** or **yarn**
- **MongoDB** (local or cloud)
- **Redis** (optional, for sessions/caching)

## 🛠️ Development Setup

### Local Development

#### Backend Setup
```bash
cd urdu-rent-space-backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

#### Frontend Setup
```bash
cd urdu-rent-space
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

The frontend will run on `http://localhost:5173` and backend on `http://localhost:5000`.

## 🚀 Deployment

- **Frontend**: Vercel (`urdu-rent-space/vercel.json` handles SPA rewrites)
- **Backend**: Render (`.github/workflows/keep-alive.yml` pings it on a schedule to keep it awake)

## 🏗️ Architecture

### System Architecture
```
┌──────────────┐  ┌───────────────┐
│   Frontend   │  │    Backend    │
│  React SPA   ├──►  Express API  │
│  (Vercel)    │  │   (Render)    │
└──────────────┘  └───────┬───────┘
                          │
                  ┌───────┴────────┐
                  │                │
          ┌───────▼──────┐  ┌──────▼────────┐
          │   MongoDB    │  │     Redis     │
          │  (Database)  │  │    (Cache)    │
          └──────────────┘  └───────────────┘
```

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS + Shadcn/ui
- React Query (data fetching)
- React Router (routing)
- Stripe (payments)

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Redis (sessions/cache)
- JWT (authentication)
- Socket.io (real-time)
- Cloudinary (file upload)
- Stripe (payments)
- Twilio (SMS)

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret
CLOUDINARY_CLOUD_NAME=...
STRIPE_SECRET_KEY=sk_...
EMAIL_HOST=smtp.gmail.com
TWILIO_ACCOUNT_SID=...
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 📊 Features

### Core Features
- ✅ Bilingual support (English & Urdu with RTL)
- ✅ Multi-category rental marketplace
- ✅ User authentication (email/phone + OTP)
- ✅ Listing management (CRUD)
- ✅ Booking system
- ✅ Payment integration (Stripe, JazzCash, Easypaisa)
- ✅ User verification (email, phone, ID, biometric)
- ✅ Review & rating system
- ✅ Real-time messaging
- ✅ Subscription plans
- ✅ Admin dashboard
- ✅ Location-based search

### Security Features
- Helmet (HTTP headers)
- Rate limiting
- XSS protection
- MongoDB sanitization
- CORS configuration
- JWT authentication
- Cookie-based sessions

## 🧪 Testing

```bash
# Backend tests
cd urdu-rent-space-backend
npm test

# Frontend tests
cd urdu-rent-space
npm test
```

## 📈 Monitoring

### Health Checks

- Backend: `GET /api/v1/health`

## 🔐 Security Considerations

1. **Never commit secrets** to version control
2. Use **environment variables** for sensitive data
3. Enable **HTTPS/TLS** in production
4. Use **secret management** for production credentials
5. Enable **audit logging**
6. Regular **security updates**

## 📝 License

MIT

## 👥 Contributors

Urdu Rent Space Team

## 📞 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for the Pakistani market**
