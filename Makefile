# Makefile for Urdu Rental Space

.PHONY: help install dev build docker-build docker-up docker-down docker-logs k8s-deploy k8s-delete health-check

# Default target
help:
	@echo "Urdu Rental Space - Makefile Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install          - Install dependencies for both frontend and backend"
	@echo "  make dev              - Run development servers"
	@echo "  make build            - Build production bundles"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build     - Build Docker images"
	@echo "  make docker-up        - Start Docker Compose services"
	@echo "  make docker-down      - Stop Docker Compose services"
	@echo "  make docker-logs      - View Docker logs"
	@echo "  make docker-clean     - Remove all Docker containers and volumes"
	@echo ""
	@echo "Kubernetes:"
	@echo "  make k8s-deploy       - Deploy to Kubernetes"
	@echo "  make k8s-delete       - Delete Kubernetes resources"
	@echo "  make k8s-status       - Check Kubernetes status"
	@echo "  make k8s-logs         - View Kubernetes logs"
	@echo ""
	@echo "Utilities:"
	@echo "  make health-check     - Run health check"
	@echo "  make test             - Run tests"
	@echo "  make lint             - Run linters"

# Development
install:
	@echo "📦 Installing dependencies..."
	cd urdu-rent-space-backend && npm install
	cd urdu-rent-space && npm install

dev:
	@echo "🚀 Starting development servers..."
	@echo "Backend: http://localhost:5000"
	@echo "Frontend: http://localhost:5173"
	@echo ""
	@echo "Run in separate terminals:"
	@echo "  Terminal 1: cd urdu-rent-space-backend && npm run dev"
	@echo "  Terminal 2: cd urdu-rent-space && npm run dev"

build:
	@echo "📦 Building production bundles..."
	cd urdu-rent-space-backend && npm run build
	cd urdu-rent-space && npm run build

# Docker
docker-build:
	@echo "🐳 Building Docker images..."
	docker-compose build

docker-up:
	@echo "🚀 Starting Docker Compose services..."
	docker-compose up -d
	@echo ""
	@echo "✅ Services started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:5000"

docker-down:
	@echo "🛑 Stopping Docker Compose services..."
	docker-compose down

docker-logs:
	@echo "📋 Viewing Docker logs..."
	docker-compose logs -f

docker-clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v
	docker system prune -f

# Kubernetes
k8s-deploy:
	@echo "☸️  Deploying to Kubernetes..."
	kubectl apply -f k8s/
	@echo "✅ Deployment complete!"

k8s-delete:
	@echo "🗑️  Deleting Kubernetes resources..."
	kubectl delete -f k8s/

k8s-status:
	@echo "📊 Kubernetes Status:"
	@echo ""
	kubectl get pods -n urdu-rental
	@echo ""
	kubectl get svc -n urdu-rental
	@echo ""
	kubectl get ingress -n urdu-rental

k8s-logs:
	@echo "📋 Select service to view logs:"
	@echo "1) backend"
	@echo "2) frontend"
	@echo "3) mongodb"
	@echo "4) redis"
	@read -p "Enter choice: " choice; \
	case $$choice in \
		1) kubectl logs -f deployment/backend -n urdu-rental ;; \
		2) kubectl logs -f deployment/frontend -n urdu-rental ;; \
		3) kubectl logs -f deployment/mongodb -n urdu-rental ;; \
		4) kubectl logs -f deployment/redis -n urdu-rental ;; \
		*) echo "Invalid choice" ;; \
	esac

# Utilities
health-check:
	@echo "🏥 Running health check..."
	@./scripts/health-check.sh docker

test:
	@echo "🧪 Running tests..."
	cd urdu-rent-space-backend && npm test
	cd urdu-rent-space && npm test

lint:
	@echo "🔍 Running linters..."
	cd urdu-rent-space-backend && npm run lint
	cd urdu-rent-space && npm run lint

# Quick commands
up: docker-up
down: docker-down
logs: docker-logs
status: k8s-status
