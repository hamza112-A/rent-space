# Urdu Rent Space - Full Stack Rental Marketplace

A comprehensive bilingual (English/Urdu) rental marketplace platform for Pakistan, supporting multiple categories including properties, vehicles, clothes, equipment, services, and more.

## 🚀 Project Structure

```
mudassir/
├── urdu-rent-space/           # Frontend (React + TypeScript + Vite)
├── urdu-rent-space-backend/   # Backend (Node.js + Express + MongoDB)
├── k8s/                       # Kubernetes manifests
├── docker-compose.yml         # Docker Compose configuration
└── .env.docker               # Environment variables template
```

## 📋 Prerequisites

- **Node.js** >= 16.0.0
- **npm** or **yarn**
- **MongoDB** (local or cloud)
- **Redis** (optional, for sessions/caching)
- **Docker** (for containerization)
- **Kubernetes** (for orchestration)

## 🛠️ Development Setup

### Local Development (Without Docker)

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

## 🐳 Docker Deployment

### Quick Start with Docker Compose

1. **Copy environment file:**
```bash
cp .env.docker .env
```

2. **Edit `.env` with your credentials** (important!)

3. **Build and run:**
```bash
docker-compose up -d
```

4. **Access the application:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: localhost:27017
- Redis: localhost:6379

5. **View logs:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

6. **Stop services:**
```bash
docker-compose down
```

### Building Individual Images

#### Build Backend
```bash
cd urdu-rent-space-backend
docker build -t urdu-rental-backend:latest .
```

#### Build Frontend
```bash
cd urdu-rent-space
docker build -t urdu-rental-frontend:latest \
  --build-arg VITE_API_BASE_URL=http://localhost:5000/api/v1 \
  --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key .
```

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (Minikube, GKE, EKS, AKS, etc.)
- kubectl installed and configured
- Container registry (Docker Hub, GCR, ECR)

### Deployment Steps

1. **Build and push images:**
```bash
# Tag and push backend
docker tag urdu-rental-backend:latest your-registry/urdu-rental-backend:latest
docker push your-registry/urdu-rental-backend:latest

# Tag and push frontend
docker tag urdu-rental-frontend:latest your-registry/urdu-rental-frontend:latest
docker push your-registry/urdu-rental-frontend:latest
```

2. **Update image references in k8s manifests**

3. **Create secrets:**
```bash
# Edit k8s/secrets.yaml with your actual credentials
# Or use kubectl:
kubectl create namespace urdu-rental
kubectl create secret generic urdu-rental-secrets \
  --from-literal=MONGODB_URI='mongodb://...' \
  --from-literal=JWT_SECRET='your-secret' \
  --namespace=urdu-rental
```

4. **Deploy to Kubernetes:**
```bash
kubectl apply -f k8s/
# Or using Kustomize
kubectl apply -k k8s/
```

5. **Verify deployment:**
```bash
kubectl get pods -n urdu-rental
kubectl get svc -n urdu-rental
kubectl get ingress -n urdu-rental
```

For detailed Kubernetes instructions, see [k8s/README.md](k8s/README.md)

## 🏗️ Architecture

### System Architecture
```
┌─────────────────────────────────────────────────┐
│              Ingress / Load Balancer            │
└───────────────┬─────────────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
┌───────▼──────┐  ┌──────▼────────┐
│   Frontend   │  │    Backend    │
│  React SPA   │  │  Express API  │
│  (Nginx)     │  │               │
└──────────────┘  └───────┬────────┘
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
- Frontend: `GET /health`

### Logs

```bash
# Docker
docker-compose logs -f

# Kubernetes
kubectl logs -f deployment/backend -n urdu-rental
kubectl logs -f deployment/frontend -n urdu-rental
```

## 🚀 Scaling

### Horizontal Scaling (Kubernetes)

The application includes HorizontalPodAutoscaler configurations:
- Backend: 2-10 replicas (CPU/Memory based)
- Frontend: 2-5 replicas (CPU based)

```bash
kubectl get hpa -n urdu-rental
```

## 🔐 Security Considerations

1. **Never commit secrets** to version control
2. Use **environment variables** for sensitive data
3. Enable **HTTPS/TLS** in production
4. Configure **network policies** in Kubernetes
5. Use **secret management** (Sealed Secrets, Vault)
6. Enable **audit logging**
7. Regular **security updates**

## 📝 License

MIT

## 👥 Contributors

Urdu Rent Space Team

## 📞 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for the Pakistani market**
