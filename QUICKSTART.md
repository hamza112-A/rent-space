# Quick Start Guide - Urdu Rental Space

Get your Urdu Rental Space application up and running in minutes!

## 🎯 Choose Your Path

### Option 1: Docker (Recommended for Quick Start) ⚡

**Time:** ~5 minutes

```bash
# 1. Clone and navigate
cd /Users/macbookpro/Downloads/mudassir

# 2. Configure environment
cp .env.docker .env
# Edit .env with your values (at minimum: MongoDB password, JWT secrets)

# 3. Start services
docker-compose up -d

# 4. Verify
docker-compose ps
```

**Access your app:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/v1
- MongoDB: localhost:27017

### Option 2: Local Development 💻

**Time:** ~10 minutes

**Prerequisites:**
- Node.js 16+
- MongoDB running locally or cloud instance
- Redis (optional)

```bash
# Backend setup
cd urdu-rent-space-backend
npm install
cp .env.example .env
# Edit .env with your MongoDB connection and other settings
npm run dev  # Runs on port 5000

# In another terminal - Frontend setup
cd urdu-rent-space
npm install
cp .env.example .env
# Edit .env with backend URL
npm run dev  # Runs on port 5173
```

### Option 3: Kubernetes 🚀

**Time:** ~20 minutes

**Prerequisites:**
- Kubernetes cluster
- kubectl configured
- Docker registry

```bash
# 1. Build and push images
export REGISTRY="your-registry/username"

docker build -t $REGISTRY/urdu-rental-backend:latest ./urdu-rent-space-backend
docker build -t $REGISTRY/urdu-rental-frontend:latest ./urdu-rent-space

docker push $REGISTRY/urdu-rental-backend:latest
docker push $REGISTRY/urdu-rental-frontend:latest

# 2. Update k8s manifests with your registry

# 3. Create secrets
kubectl create namespace urdu-rental
# Edit k8s/secrets.yaml with actual values
kubectl apply -f k8s/secrets.yaml

# 4. Deploy
kubectl apply -f k8s/

# 5. Verify
kubectl get pods -n urdu-rental
```

## 🔧 Configuration Checklist

Before running, update these in your `.env` file:

### Essential (Docker & Local)
- [ ] `MONGO_ROOT_PASSWORD` - Database password
- [ ] `JWT_SECRET` - JWT signing key (min 32 chars)
- [ ] `JWT_REFRESH_SECRET` - Refresh token key

### For Full Functionality
- [ ] `CLOUDINARY_*` - File uploads (images)
- [ ] `STRIPE_SECRET_KEY` - Payment processing
- [ ] `EMAIL_USER` & `EMAIL_PASS` - Email notifications
- [ ] `TWILIO_*` - SMS/OTP functionality

### Optional
- [ ] `REDIS_URL` - Session/cache storage
- [ ] `GOOGLE_MAPS_API_KEY` - Location services

## 📊 Verify Installation

### Using Make (if available)
```bash
make health-check
```

### Using Scripts
```bash
# Docker
./scripts/health-check.sh docker

# Kubernetes
./scripts/health-check.sh kubernetes
```

### Manual Check
```bash
# Check backend health
curl http://localhost:5000/api/v1/health

# Check frontend (Docker)
curl http://localhost:3000

# Check frontend (Local dev)
curl http://localhost:5173
```

## 🎮 Common Commands

### Docker
```bash
# Start services
make docker-up
# or
docker-compose up -d

# View logs
make docker-logs
# or
docker-compose logs -f

# Stop services
make docker-down
# or
docker-compose down

# Restart a service
docker-compose restart backend

# Clean up everything
make docker-clean
```

### Local Development
```bash
# Backend
cd urdu-rent-space-backend
npm run dev      # Development with auto-reload
npm start        # Production mode
npm test         # Run tests

# Frontend
cd urdu-rent-space
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

### Kubernetes
```bash
# Deploy/Update
kubectl apply -f k8s/

# Check status
kubectl get pods -n urdu-rental
kubectl get svc -n urdu-rental

# View logs
kubectl logs -f deployment/backend -n urdu-rental

# Scale
kubectl scale deployment backend --replicas=3 -n urdu-rental

# Delete
kubectl delete -f k8s/
```

## 🐛 Troubleshooting

### Docker Issues

**Problem:** Containers won't start
```bash
# Check logs
docker-compose logs

# Check if ports are in use
lsof -i :3000
lsof -i :5000
lsof -i :27017
```

**Problem:** MongoDB connection failed
```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check connection string in .env
```

**Problem:** Frontend can't reach backend
```bash
# Verify backend is running
curl http://localhost:5000/api/v1/health

# Check VITE_API_BASE_URL in frontend .env
```

### Kubernetes Issues

**Problem:** Pods in CrashLoopBackOff
```bash
# Check pod details
kubectl describe pod <pod-name> -n urdu-rental

# Check logs
kubectl logs <pod-name> -n urdu-rental

# Common causes:
# - Missing/incorrect secrets
# - Image pull errors
# - Database connection issues
```

**Problem:** ImagePullBackOff
```bash
# Verify image names match your registry
kubectl describe pod <pod-name> -n urdu-rental

# Check registry credentials
```

**Problem:** Service not accessible
```bash
# Check service
kubectl get svc -n urdu-rental

# Check ingress
kubectl get ingress -n urdu-rental
kubectl describe ingress urdu-rental-ingress -n urdu-rental
```

## 📚 Next Steps

1. **Test the Application**
   - Register a new user
   - Create a listing
   - Test booking flow
   - Try payment (test mode)

2. **Configure Domain & SSL**
   - Update DNS records
   - Setup TLS certificates (Let's Encrypt)
   - Configure ingress for production

3. **Setup Monitoring**
   - Install Prometheus & Grafana
   - Configure alerts
   - Setup log aggregation

4. **Implement Backups**
   - MongoDB backup strategy
   - Test restore procedures

5. **CI/CD Pipeline**
   - Configure GitHub Actions
   - Setup staging environment
   - Automated deployments

## 🔐 Security Checklist

Before going to production:

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS/TLS
- [ ] Setup firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use secret management (Sealed Secrets/Vault)
- [ ] Enable audit logging
- [ ] Setup backup encryption
- [ ] Regular security updates

## 📞 Getting Help

- **Documentation:** Check [README.md](README.md) and [DEPLOYMENT.md](DEPLOYMENT.md)
- **Logs:** Always check logs first
- **GitHub Issues:** Report bugs and feature requests
- **Community:** Join our Discord/Slack

## 🎉 Success!

If you see the application running:

```
Frontend ✅ http://localhost:3000
Backend  ✅ http://localhost:5000
```

**Congratulations!** 🎊 Your Urdu Rental Space is up and running!

---

**Need more help?** Check the detailed [DEPLOYMENT.md](DEPLOYMENT.md) guide.
