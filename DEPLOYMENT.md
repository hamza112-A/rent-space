# Deployment Guide - Urdu Rental Space

This guide covers deployment options for the Urdu Rental Space application.

## Table of Contents

1. [Docker Deployment](#docker-deployment)
2. [Kubernetes Deployment](#kubernetes-deployment)
3. [Cloud Platforms](#cloud-platforms)
4. [CI/CD Setup](#cicd-setup)
5. [Production Checklist](#production-checklist)

## Docker Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Quick Start

1. **Clone the repository:**
```bash
git clone <repository-url>
cd mudassir
```

2. **Configure environment:**
```bash
cp .env.docker .env
nano .env  # Update with your values
```

3. **Deploy:**
```bash
# Using helper script
./scripts/deploy.sh docker

# Or manually
docker-compose up -d
```

4. **Verify deployment:**
```bash
./scripts/health-check.sh docker
```

### Docker Compose Services

- **frontend**: React app (port 3000)
- **backend**: Node.js API (port 5000)
- **mongodb**: Database (port 27017)
- **redis**: Cache/sessions (port 6379)
- **nginx-proxy**: Reverse proxy (optional, port 80/443)

### Docker Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart backend

# Scale services
docker-compose up -d --scale backend=3

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (v1.24+)
- kubectl configured
- Container registry access

### Step-by-Step Deployment

#### 1. Build and Push Images

```bash
# Set your registry
export REGISTRY="your-registry.com/username"

# Build and push backend
cd urdu-rent-space-backend
docker build -t $REGISTRY/urdu-rental-backend:v1.0.0 .
docker push $REGISTRY/urdu-rental-backend:v1.0.0

# Build and push frontend
cd ../urdu-rent-space
docker build -t $REGISTRY/urdu-rental-frontend:v1.0.0 \
  --build-arg VITE_API_BASE_URL=https://api.yourdomain.com/api/v1 \
  --build-arg VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_KEY .
docker push $REGISTRY/urdu-rental-frontend:v1.0.0
```

#### 2. Update Kubernetes Manifests

Edit `k8s/backend-deployment.yaml` and `k8s/frontend-deployment.yaml`:
```yaml
image: your-registry.com/username/urdu-rental-backend:v1.0.0
image: your-registry.com/username/urdu-rental-frontend:v1.0.0
```

#### 3. Configure Secrets

**Option A: Direct creation**
```bash
kubectl create namespace urdu-rental

kubectl create secret generic urdu-rental-secrets \
  --from-literal=MONGODB_URI='mongodb://...' \
  --from-literal=JWT_SECRET='your-secret' \
  --from-literal=STRIPE_SECRET_KEY='sk_...' \
  --namespace=urdu-rental
```

**Option B: Using manifest (secure with Sealed Secrets)**
```bash
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Seal your secrets
kubeseal --format=yaml < k8s/secrets.yaml > k8s/sealed-secrets.yaml
kubectl apply -f k8s/sealed-secrets.yaml
```

#### 4. Deploy to Cluster

```bash
# Deploy all resources
kubectl apply -f k8s/

# Or using Kustomize
kubectl apply -k k8s/

# Or using helper script
./scripts/deploy.sh kubernetes
```

#### 5. Verify Deployment

```bash
# Check resources
kubectl get all -n urdu-rental

# Check pod status
kubectl get pods -n urdu-rental -w

# Check logs
kubectl logs -f deployment/backend -n urdu-rental

# Run health check
./scripts/health-check.sh kubernetes
```

#### 6. Configure Ingress

Update `k8s/ingress.yaml` with your domain and apply:
```bash
kubectl apply -f k8s/ingress.yaml
```

### Kubernetes Architecture

```
Internet
   │
   ▼
┌────────────────────┐
│  Ingress (nginx)   │
│  - TLS termination │
│  - Load balancing  │
└─────────┬──────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌─────────┐ ┌─────────┐
│Frontend │ │Backend  │
│Service  │ │Service  │
│(ClusterIP)│(ClusterIP)│
└────┬────┘ └────┬────┘
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│Frontend │ │Backend  │
│Pods     │ │Pods     │
│(2-5)    │ │(2-10)   │
└─────────┘ └────┬────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
    ┌─────────┐     ┌─────────┐
    │MongoDB  │     │ Redis   │
    │StatefulSet│   │StatefulSet│
    └─────────┘     └─────────┘
         │                │
         ▼                ▼
    ┌─────────┐     ┌─────────┐
    │MongoDB  │     │ Redis   │
    │  PVC    │     │  PVC    │
    └─────────┘     └─────────┘
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment backend --replicas=5 -n urdu-rental

# Auto-scaling is configured via HPA
kubectl get hpa -n urdu-rental
```

### Updates and Rollbacks

```bash
# Update deployment
kubectl set image deployment/backend backend=$REGISTRY/urdu-rental-backend:v1.1.0 -n urdu-rental

# Check rollout status
kubectl rollout status deployment/backend -n urdu-rental

# Rollback if needed
kubectl rollout undo deployment/backend -n urdu-rental

# View rollout history
kubectl rollout history deployment/backend -n urdu-rental
```

## Cloud Platforms

### Google Cloud Platform (GKE)

```bash
# Create GKE cluster
gcloud container clusters create urdu-rental-cluster \
  --num-nodes=3 \
  --machine-type=n1-standard-2 \
  --zone=asia-south1-a

# Get credentials
gcloud container clusters get-credentials urdu-rental-cluster

# Deploy
kubectl apply -f k8s/
```

### Amazon Web Services (EKS)

```bash
# Create EKS cluster (using eksctl)
eksctl create cluster \
  --name urdu-rental-cluster \
  --region ap-south-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3

# Deploy
kubectl apply -f k8s/
```

### Microsoft Azure (AKS)

```bash
# Create resource group
az group create --name urdu-rental-rg --location southeastasia

# Create AKS cluster
az aks create \
  --resource-group urdu-rental-rg \
  --name urdu-rental-cluster \
  --node-count 3 \
  --node-vm-size Standard_DS2_v2

# Get credentials
az aks get-credentials --resource-group urdu-rental-rg --name urdu-rental-cluster

# Deploy
kubectl apply -f k8s/
```

### DigitalOcean Kubernetes

```bash
# Create cluster via UI or doctl
doctl kubernetes cluster create urdu-rental-cluster \
  --region sgp1 \
  --node-pool "name=worker-pool;size=s-2vcpu-4gb;count=3"

# Deploy
kubectl apply -f k8s/
```

## CI/CD Setup

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Kubernetes

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and Push Images
        run: |
          docker build -t ${{ secrets.REGISTRY }}/urdu-rental-backend:${{ github.sha }} ./urdu-rent-space-backend
          docker build -t ${{ secrets.REGISTRY }}/urdu-rental-frontend:${{ github.sha }} ./urdu-rent-space
          docker push ${{ secrets.REGISTRY }}/urdu-rental-backend:${{ github.sha }}
          docker push ${{ secrets.REGISTRY }}/urdu-rental-frontend:${{ github.sha }}
      
      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          manifests: |
            k8s/namespace.yaml
            k8s/configmap.yaml
            k8s/backend-deployment.yaml
            k8s/frontend-deployment.yaml
          images: |
            ${{ secrets.REGISTRY }}/urdu-rental-backend:${{ github.sha }}
            ${{ secrets.REGISTRY }}/urdu-rental-frontend:${{ github.sha }}
```

## Production Checklist

### Security
- [ ] All secrets stored securely (Sealed Secrets, Vault)
- [ ] TLS/HTTPS enabled
- [ ] Network policies configured
- [ ] RBAC configured
- [ ] Security scanning enabled
- [ ] Regular security updates

### Monitoring
- [ ] Prometheus installed
- [ ] Grafana dashboards configured
- [ ] Application metrics exposed
- [ ] Log aggregation (ELK, Loki)
- [ ] Alerting configured
- [ ] Uptime monitoring

### Backup & Disaster Recovery
- [ ] MongoDB backups automated
- [ ] Backup retention policy
- [ ] Disaster recovery plan
- [ ] Regular restore tests

### Performance
- [ ] Resource limits configured
- [ ] Horizontal autoscaling enabled
- [ ] CDN configured for static assets
- [ ] Database indexes optimized
- [ ] Caching strategy implemented

### Documentation
- [ ] Deployment runbook
- [ ] Incident response plan
- [ ] Architecture documentation
- [ ] API documentation
- [ ] Team training completed

## Troubleshooting

### Common Issues

**Pods in CrashLoopBackOff:**
```bash
kubectl describe pod <pod-name> -n urdu-rental
kubectl logs <pod-name> -n urdu-rental
```

**ImagePullBackOff:**
- Check image name and tag
- Verify registry credentials
- Ensure images are pushed

**Service not accessible:**
```bash
kubectl get svc -n urdu-rental
kubectl describe svc backend-service -n urdu-rental
```

**Database connection issues:**
- Verify MongoDB is running
- Check connection string
- Verify network policies

## Support

For additional help:
- Check logs: `kubectl logs -f <pod-name> -n urdu-rental`
- Review events: `kubectl get events -n urdu-rental`
- Contact DevOps team

---

**Last Updated:** 2025
