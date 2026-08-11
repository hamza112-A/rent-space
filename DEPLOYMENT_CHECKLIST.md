# Deployment Checklist - Urdu Rental Space

Complete this checklist before deploying to production.

## 📋 Pre-Deployment Checklist

### 1. Environment Configuration ✓

#### Docker Deployment
- [ ] Copy `.env.docker` to `.env`
- [ ] Update `MONGO_ROOT_PASSWORD` with secure password (min 16 chars)
- [ ] Update `JWT_SECRET` (min 32 characters)
- [ ] Update `JWT_REFRESH_SECRET` (different from JWT_SECRET)
- [ ] Add `CLOUDINARY_*` credentials for file uploads
- [ ] Add `STRIPE_SECRET_KEY` for payments
- [ ] Add `EMAIL_USER` and `EMAIL_PASS` for notifications
- [ ] Add `TWILIO_*` credentials for SMS/OTP
- [ ] Verify `VITE_API_BASE_URL` points to correct backend
- [ ] Add `VITE_STRIPE_PUBLISHABLE_KEY`

#### Kubernetes Deployment
- [ ] Update `k8s/secrets.yaml` with real credentials (base64 encoded)
- [ ] Update `k8s/configmap.yaml` with production settings
- [ ] Update image references in `k8s/backend-deployment.yaml`
- [ ] Update image references in `k8s/frontend-deployment.yaml`
- [ ] Update domain in `k8s/ingress.yaml`
- [ ] Configure TLS certificates in `k8s/ingress.yaml`

### 2. Security Hardening ✓

- [ ] All passwords are strong (min 16 chars, mixed case, numbers, symbols)
- [ ] JWT secrets are cryptographically secure random strings
- [ ] No secrets committed to git
- [ ] `.env` is in `.gitignore`
- [ ] `k8s/secrets.yaml` uses Sealed Secrets or external secret management
- [ ] HTTPS/TLS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers configured (Helmet)
- [ ] Database authentication enabled
- [ ] Redis password set (if using Redis)

### 3. Docker Images ✓

- [ ] Backend Dockerfile reviewed
- [ ] Frontend Dockerfile reviewed
- [ ] Images built successfully
  ```bash
  docker build -t urdu-rental-backend:test ./urdu-rent-space-backend
  docker build -t urdu-rental-frontend:test ./urdu-rent-space
  ```
- [ ] Images tagged with version
- [ ] Images pushed to registry (for K8s)
- [ ] Image sizes optimized (<500MB backend, <100MB frontend)
- [ ] Non-root users configured in containers
- [ ] Health checks working

### 4. Database Setup ✓

- [ ] MongoDB connection string correct
- [ ] Database name configured
- [ ] Authentication enabled
- [ ] Backup strategy planned
- [ ] Data persistence configured (volumes/PVCs)
- [ ] Indexes created (run after first deployment)
- [ ] Initial data seeded (if needed)
- [ ] Connection pool sized appropriately

### 5. Network Configuration ✓

#### Docker
- [ ] Port mappings correct (3000, 5000, 27017, 6379)
- [ ] Services can communicate on Docker network
- [ ] External access configured correctly

#### Kubernetes
- [ ] Services created (ClusterIP for internal)
- [ ] Ingress configured for external access
- [ ] DNS records updated
- [ ] Load balancer configured
- [ ] Network policies reviewed (optional)
- [ ] Service mesh configured (optional)

### 6. Resource Limits ✓

- [ ] CPU requests/limits set for all containers
- [ ] Memory requests/limits set for all containers
- [ ] Storage sizes configured (MongoDB: 10Gi, Redis: 5Gi)
- [ ] PVC storage classes specified
- [ ] Resource quotas defined (optional)
- [ ] LimitRanges configured (optional)

### 7. Scaling Configuration ✓

- [ ] HPA configured for backend (2-10 replicas)
- [ ] HPA configured for frontend (2-5 replicas)
- [ ] HPA metrics appropriate (CPU: 70%, Memory: 80%)
- [ ] Initial replica counts set
- [ ] Cluster has sufficient resources for scaling

### 8. Monitoring & Logging ✓

- [ ] Health check endpoints working (`/api/v1/health`)
- [ ] Liveness probes configured
- [ ] Readiness probes configured
- [ ] Log aggregation configured (optional)
- [ ] Metrics collection configured (optional)
- [ ] Alerting rules defined (optional)
- [ ] Dashboards created (optional)

### 9. Backup & Recovery ✓

- [ ] Backup strategy documented
- [ ] Automated backups configured
- [ ] Backup retention policy defined
- [ ] Restore procedure tested
- [ ] Disaster recovery plan documented
- [ ] RTO/RPO defined (suggested: 4hr/1hr)

### 10. Testing ✓

- [ ] Unit tests passing (backend & frontend)
- [ ] Integration tests passing
- [ ] API endpoints tested
- [ ] Authentication flow tested
- [ ] Payment flow tested (test mode)
- [ ] File upload tested
- [ ] Email/SMS notifications tested
- [ ] Load testing performed (optional)
- [ ] Security scanning performed (optional)

## 🚀 Deployment Steps

### Docker Deployment

```bash
# 1. Verify setup
./verify-setup.sh

# 2. Configure environment
cp .env.docker .env
nano .env  # Update all values

# 3. Build images
docker-compose build

# 4. Start services
docker-compose up -d

# 5. Verify deployment
./scripts/health-check.sh docker

# 6. Check logs
docker-compose logs -f

# 7. Test application
# Visit http://localhost:3000
# Test user registration
# Test listing creation
# Test booking flow
```

### Kubernetes Deployment

```bash
# 1. Verify setup
./verify-setup.sh

# 2. Build and push images
export REGISTRY="your-registry.com/username"

docker build -t $REGISTRY/urdu-rental-backend:v1.0.0 ./urdu-rent-space-backend
docker build -t $REGISTRY/urdu-rental-frontend:v1.0.0 ./urdu-rent-space

docker push $REGISTRY/urdu-rental-backend:v1.0.0
docker push $REGISTRY/urdu-rental-frontend:v1.0.0

# 3. Update manifests
# Edit k8s/backend-deployment.yaml - update image
# Edit k8s/frontend-deployment.yaml - update image
# Edit k8s/secrets.yaml - add real credentials
# Edit k8s/ingress.yaml - update domain

# 4. Deploy to cluster
kubectl apply -f k8s/

# 5. Wait for rollout
kubectl rollout status deployment/backend -n urdu-rental
kubectl rollout status deployment/frontend -n urdu-rental

# 6. Verify deployment
./scripts/health-check.sh kubernetes

# 7. Check pods
kubectl get pods -n urdu-rental

# 8. Check services
kubectl get svc -n urdu-rental

# 9. Check ingress
kubectl get ingress -n urdu-rental

# 10. Test application
# Visit your domain
# Test all functionality
```

## ✅ Post-Deployment Checklist

### Immediate (Day 1)
- [ ] All services are running
- [ ] Health checks passing
- [ ] Application accessible via domain
- [ ] SSL/TLS working (HTTPS)
- [ ] User registration works
- [ ] Login/logout works
- [ ] OTP verification works
- [ ] Listing creation works
- [ ] Image upload works
- [ ] Booking flow works
- [ ] Payment flow works (test mode)
- [ ] Email notifications working
- [ ] SMS notifications working

### Short-term (Week 1)
- [ ] Monitoring configured and working
- [ ] Alerting rules tested
- [ ] Backup job running
- [ ] Logs aggregated and searchable
- [ ] Team trained on deployment
- [ ] Runbook documented
- [ ] Incident response plan ready
- [ ] On-call rotation set up

### Long-term (Month 1)
- [ ] Performance baseline established
- [ ] Auto-scaling tested
- [ ] Disaster recovery tested
- [ ] Security audit completed
- [ ] Load testing completed
- [ ] User feedback collected
- [ ] Metrics dashboard reviewed
- [ ] Cost optimization reviewed

## 🔍 Verification Commands

### Docker
```bash
# Check all services
docker-compose ps

# Health check
curl http://localhost:5000/api/v1/health

# Frontend check
curl http://localhost:3000

# MongoDB check
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Redis check
docker-compose exec redis redis-cli ping

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Kubernetes
```bash
# Check pods
kubectl get pods -n urdu-rental

# Check services
kubectl get svc -n urdu-rental

# Check ingress
kubectl get ingress -n urdu-rental

# Check HPA
kubectl get hpa -n urdu-rental

# Health check via service
kubectl run test --image=curlimages/curl -it --rm -- curl http://backend-service:5000/api/v1/health

# View logs
kubectl logs -f deployment/backend -n urdu-rental
kubectl logs -f deployment/frontend -n urdu-rental

# Check events
kubectl get events -n urdu-rental --sort-by='.lastTimestamp'

# Resource usage
kubectl top pods -n urdu-rental
kubectl top nodes
```

## 🚨 Rollback Procedures

### Docker Rollback
```bash
# Stop current version
docker-compose down

# Restore previous version
git checkout <previous-commit>

# Rebuild and start
docker-compose build
docker-compose up -d
```

### Kubernetes Rollback
```bash
# View rollout history
kubectl rollout history deployment/backend -n urdu-rental

# Rollback to previous version
kubectl rollout undo deployment/backend -n urdu-rental
kubectl rollout undo deployment/frontend -n urdu-rental

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=2 -n urdu-rental

# Check rollback status
kubectl rollout status deployment/backend -n urdu-rental
```

## 📞 Emergency Contacts

### Incident Response
1. **Check logs** first
2. **Check monitoring** dashboards
3. **Check resource** usage
4. **Contact DevOps** team
5. **Escalate** if needed

### Key Contacts
- DevOps Lead: [contact]
- Backend Lead: [contact]
- Frontend Lead: [contact]
- Database Admin: [contact]
- Security Team: [contact]

## 📊 Success Criteria

Deployment is successful when:
- ✅ All services are running
- ✅ Health checks passing for 10+ minutes
- ✅ No error logs
- ✅ Application accessible
- ✅ Core features working:
  - User registration
  - Login/logout
  - Listing CRUD
  - Booking flow
  - Payment processing
  - Notifications
- ✅ Response times < 500ms (p95)
- ✅ Error rate < 1%
- ✅ SSL/TLS working
- ✅ Auto-scaling working (K8s)

## 🎉 Deployment Complete!

Once all checklists are complete:
1. Update team on deployment status
2. Document any issues encountered
3. Update runbook with learnings
4. Schedule post-deployment review
5. Monitor application for 24-48 hours

---

**Last Updated:** 2025  
**Version:** 1.0.0  
**Maintained by:** DevOps Team
