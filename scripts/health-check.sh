#!/bin/bash

# Health check script for Urdu Rental Space
# Usage: ./scripts/health-check.sh [docker|kubernetes]

DEPLOY_TYPE=${1:-docker}

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🏥 Health Check - Urdu Rental Space"
echo ""

check_url() {
    local url=$1
    local name=$2
    
    if curl -s -f -o /dev/null "$url"; then
        echo -e "${GREEN}✅ $name is healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ $name is not responding${NC}"
        return 1
    fi
}

case $DEPLOY_TYPE in
    docker)
        echo "🐳 Checking Docker services..."
        echo ""
        
        # Check if containers are running
        if docker-compose ps | grep -q "Up"; then
            echo -e "${GREEN}✅ Docker containers are running${NC}"
        else
            echo -e "${RED}❌ Docker containers are not running${NC}"
            exit 1
        fi
        
        echo ""
        echo "📡 Checking service endpoints..."
        echo ""
        
        # Check backend
        check_url "http://localhost:5000/api/v1/health" "Backend API"
        
        # Check frontend
        check_url "http://localhost:3000" "Frontend"
        
        # Check MongoDB
        if docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping')" &> /dev/null; then
            echo -e "${GREEN}✅ MongoDB is healthy${NC}"
        else
            echo -e "${RED}❌ MongoDB is not responding${NC}"
        fi
        
        # Check Redis
        if docker-compose exec -T redis redis-cli ping &> /dev/null; then
            echo -e "${GREEN}✅ Redis is healthy${NC}"
        else
            echo -e "${RED}❌ Redis is not responding${NC}"
        fi
        ;;
        
    kubernetes|k8s)
        echo "☸️  Checking Kubernetes resources..."
        echo ""
        
        # Check if namespace exists
        if kubectl get namespace urdu-rental &> /dev/null; then
            echo -e "${GREEN}✅ Namespace exists${NC}"
        else
            echo -e "${RED}❌ Namespace not found${NC}"
            exit 1
        fi
        
        echo ""
        echo "🔍 Pod status:"
        kubectl get pods -n urdu-rental
        
        echo ""
        echo "📊 Service status:"
        kubectl get svc -n urdu-rental
        
        echo ""
        echo "🌐 Ingress status:"
        kubectl get ingress -n urdu-rental
        
        echo ""
        echo "📈 HPA status:"
        kubectl get hpa -n urdu-rental
        
        # Check pod health
        echo ""
        echo "🏥 Pod health checks:"
        
        # Backend pods
        if kubectl get pods -n urdu-rental -l app=backend -o jsonpath='{.items[*].status.phase}' | grep -q "Running"; then
            echo -e "${GREEN}✅ Backend pods are running${NC}"
        else
            echo -e "${RED}❌ Backend pods have issues${NC}"
        fi
        
        # Frontend pods
        if kubectl get pods -n urdu-rental -l app=frontend -o jsonpath='{.items[*].status.phase}' | grep -q "Running"; then
            echo -e "${GREEN}✅ Frontend pods are running${NC}"
        else
            echo -e "${RED}❌ Frontend pods have issues${NC}"
        fi
        
        # MongoDB
        if kubectl get pods -n urdu-rental -l app=mongodb -o jsonpath='{.items[*].status.phase}' | grep -q "Running"; then
            echo -e "${GREEN}✅ MongoDB is running${NC}"
        else
            echo -e "${RED}❌ MongoDB has issues${NC}"
        fi
        
        # Redis
        if kubectl get pods -n urdu-rental -l app=redis -o jsonpath='{.items[*].status.phase}' | grep -q "Running"; then
            echo -e "${GREEN}✅ Redis is running${NC}"
        else
            echo -e "${RED}❌ Redis has issues${NC}"
        fi
        ;;
        
    *)
        echo -e "${RED}❌ Error: Invalid deployment type!${NC}"
        echo "Usage: $0 [docker|kubernetes]"
        exit 1
        ;;
esac

echo ""
echo "✨ Health check complete!"
