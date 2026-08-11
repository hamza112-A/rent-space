#!/bin/bash

# Deployment script for Urdu Rental Space
# Usage: ./scripts/deploy.sh [docker|kubernetes] [environment]

set -e

DEPLOY_TYPE=${1:-docker}
ENVIRONMENT=${2:-production}

echo "🚀 Deploying Urdu Rental Space"
echo "   Type: $DEPLOY_TYPE"
echo "   Environment: $ENVIRONMENT"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo -e "${YELLOW}📝 Copy .env.docker to .env and update with your values${NC}"
    exit 1
fi

case $DEPLOY_TYPE in
    docker)
        echo "🐳 Deploying with Docker Compose..."
        
        # Build images
        echo "📦 Building Docker images..."
        docker-compose build
        
        # Start services
        echo "🚀 Starting services..."
        docker-compose up -d
        
        # Wait for services to be healthy
        echo "⏳ Waiting for services to be healthy..."
        sleep 10
        
        # Check status
        docker-compose ps
        
        echo ""
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo ""
        echo "🌐 Access your application:"
        echo "   Frontend: http://localhost:3000"
        echo "   Backend:  http://localhost:5000"
        echo "   MongoDB:  localhost:27017"
        echo ""
        echo "📊 View logs:"
        echo "   docker-compose logs -f backend"
        echo "   docker-compose logs -f frontend"
        ;;
        
    kubernetes|k8s)
        echo "☸️  Deploying to Kubernetes..."
        
        # Check if kubectl is installed
        if ! command -v kubectl &> /dev/null; then
            echo -e "${RED}❌ Error: kubectl not found!${NC}"
            exit 1
        fi
        
        # Check if connected to cluster
        if ! kubectl cluster-info &> /dev/null; then
            echo -e "${RED}❌ Error: Not connected to a Kubernetes cluster!${NC}"
            exit 1
        fi
        
        # Build and push images
        echo "📦 Building Docker images..."
        
        read -p "Enter your Docker registry (e.g., docker.io/username): " REGISTRY
        
        # Build backend
        cd urdu-rent-space-backend
        docker build -t $REGISTRY/urdu-rental-backend:latest .
        docker push $REGISTRY/urdu-rental-backend:latest
        cd ..
        
        # Build frontend
        cd urdu-rent-space
        docker build -t $REGISTRY/urdu-rental-frontend:latest \
            --build-arg VITE_API_BASE_URL=${VITE_API_BASE_URL:-https://api.yourdomain.com/api/v1} \
            --build-arg VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY} .
        docker push $REGISTRY/urdu-rental-frontend:latest
        cd ..
        
        # Update image references in k8s manifests
        sed -i.bak "s|urdu-rental-backend:latest|$REGISTRY/urdu-rental-backend:latest|g" k8s/backend-deployment.yaml
        sed -i.bak "s|urdu-rental-frontend:latest|$REGISTRY/urdu-rental-frontend:latest|g" k8s/frontend-deployment.yaml
        
        # Apply Kubernetes manifests
        echo "📋 Applying Kubernetes manifests..."
        kubectl apply -f k8s/
        
        # Wait for deployments
        echo "⏳ Waiting for deployments to be ready..."
        kubectl wait --for=condition=available --timeout=300s deployment/backend -n urdu-rental
        kubectl wait --for=condition=available --timeout=300s deployment/frontend -n urdu-rental
        
        # Get status
        echo ""
        echo "📊 Deployment status:"
        kubectl get pods -n urdu-rental
        kubectl get svc -n urdu-rental
        kubectl get ingress -n urdu-rental
        
        echo ""
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo ""
        echo "📝 Next steps:"
        echo "   1. Update your DNS records"
        echo "   2. Configure TLS certificates"
        echo "   3. Set up monitoring"
        ;;
        
    *)
        echo -e "${RED}❌ Error: Invalid deployment type!${NC}"
        echo "Usage: $0 [docker|kubernetes] [environment]"
        exit 1
        ;;
esac
