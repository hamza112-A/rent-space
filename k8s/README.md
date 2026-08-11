# Kubernetes Deployment Guide for Urdu Rental Space

This directory contains Kubernetes manifests for deploying the Urdu Rental Space application.

## Prerequisites

1. **Kubernetes Cluster** (v1.24+)
   - Local: Minikube, Kind, or Docker Desktop
   - Cloud: GKE, EKS, AKS, or DigitalOcean Kubernetes

2. **kubectl** installed and configured

3. **Container Registry** (Docker Hub, GCR, ECR, etc.)

4. **Optional but Recommended:**
   - Ingress Controller (nginx-ingress)
   - Cert-Manager (for TLS certificates)
   - Helm (for easier installation)

## Quick Start

### 1. Build and Push Docker Images

```bash
# Build backend image
cd urdu-rent-space-backend
docker build -t your-registry/urdu-rental-backend:latest .
docker push your-registry/urdu-rental-backend:latest

# Build frontend image
cd ../urdu-rent-space
docker build -t your-registry/urdu-rental-frontend:latest \
  --build-arg VITE_API_BASE_URL=https://api.urdurental.pk/api/v1 \
  --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key .
docker push your-registry/urdu-rental-frontend:latest
```

### 2. Update Image References

Edit `backend-deployment.yaml` and `frontend-deployment.yaml` to use your image registry:

```yaml
image: your-registry/urdu-rental-backend:latest
image: your-registry/urdu-rental-frontend:latest
```

### 3. Configure Secrets

**IMPORTANT:** Update `secrets.yaml` with your actual credentials before deploying:

```bash
# Edit secrets.yaml with your actual values
nano k8s/secrets.yaml

# Or use kubectl to create secrets from environment variables
kubectl create secret generic urdu-rental-secrets \
  --from-literal=MONGODB_URI='mongodb://...' \
  --from-literal=JWT_SECRET='your-secret' \
  --namespace=urdu-rental
```

### 4. Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/

# Or use Kustomize
kubectl apply -k k8s/

# Check deployment status
kubectl get all -n urdu-rental
```

### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -n urdu-rental

# Check services
kubectl get svc -n urdu-rental

# Check ingress
kubectl get ingress -n urdu-rental

# View logs
kubectl logs -f deployment/backend -n urdu-rental
kubectl logs -f deployment/frontend -n urdu-rental
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Ingress Controller                 │
│         (nginx-ingress / traefik)              │
└───────────────┬─────────────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
┌───────▼──────┐  ┌──────▼────────┐
│   Frontend   │  │    Backend    │
│  (React +    │  │  (Node.js +   │
│   Nginx)     │  │   Express)    │
│  Port: 80    │  │  Port: 5000   │
└──────────────┘  └───────┬────────┘
                          │
                  ┌───────┴────────┐
                  │                │
          ┌───────▼──────┐  ┌──────▼────────┐
          │   MongoDB    │  │     Redis     │
          │  Port: 27017 │  │  Port: 6379   │
          └──────────────┘  └───────────────┘
```

## Scaling

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment backend --replicas=5 -n urdu-rental

# Scale frontend
kubectl scale deployment frontend --replicas=3 -n urdu-rental
```

### Auto-scaling (HPA already configured)

```bash
# View HPA status
kubectl get hpa -n urdu-rental

# Backend scales between 2-10 pods based on CPU/memory
# Frontend scales between 2-5 pods based on CPU
```

## Monitoring

```bash
# Watch pod status
kubectl get pods -n urdu-rental -w

# View resource usage
kubectl top pods -n urdu-rental
kubectl top nodes

# Get pod details
kubectl describe pod <pod-name> -n urdu-rental
```

## Troubleshooting

### Check pod logs
```bash
kubectl logs -f deployment/backend -n urdu-rental
kubectl logs -f deployment/frontend -n urdu-rental
kubectl logs -f deployment/mongodb -n urdu-rental
```

### Shell into a pod
```bash
kubectl exec -it deployment/backend -n urdu-rental -- sh
kubectl exec -it deployment/mongodb -n urdu-rental -- mongosh
```

### Check events
```bash
kubectl get events -n urdu-rental --sort-by='.lastTimestamp'
```

### Common Issues

1. **ImagePullBackOff**: Update image references or check registry credentials
2. **CrashLoopBackOff**: Check pod logs and environment variables
3. **Pending Pods**: Check PVC status and node resources

## Production Recommendations

### 1. Use Sealed Secrets or External Secrets

```bash
# Install Sealed Secrets
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Seal your secrets
kubeseal --format=yaml < secrets.yaml > sealed-secrets.yaml
kubectl apply -f sealed-secrets.yaml
```

### 2. Enable Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-netpol
  namespace: urdu-rental
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 5000
```

### 3. Set Resource Quotas

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: urdu-rental-quota
  namespace: urdu-rental
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
```

### 4. Enable Pod Disruption Budgets

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: backend-pdb
  namespace: urdu-rental
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: backend
```

### 5. Setup Monitoring

- Install Prometheus & Grafana
- Configure ServiceMonitors
- Set up alerting rules

### 6. Implement CI/CD

- GitHub Actions / GitLab CI
- ArgoCD for GitOps
- Flux for continuous delivery

## Cleanup

```bash
# Delete all resources
kubectl delete namespace urdu-rental

# Or delete individual components
kubectl delete -f k8s/
```

## Next Steps

1. Set up DNS records pointing to your ingress
2. Configure TLS certificates with cert-manager
3. Set up monitoring and logging
4. Implement backup strategies for MongoDB
5. Configure CI/CD pipelines
6. Set up staging environment

## Support

For issues or questions, contact the development team or check the main project README.
