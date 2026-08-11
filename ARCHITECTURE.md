# Architecture Documentation - Urdu Rental Space

## System Overview

The Urdu Rental Space is a full-stack, containerized application designed for scalability and high availability.

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet / Users                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Load Balancer  │
                    │   / Ingress      │
                    └────────┬─────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                 │
     ┌──────▼─────┐                   ┌───────▼──────┐
     │  Frontend   │                  │   Backend    │
     │  (React)    │◄────REST API────▶│   (Node.js)  │
     │  Nginx      │                  │   Express    │
     └─────────────┘                  └───────┬──────┘
                                              │
                               ┌──────────────┴──────────────┐
                               │                             │
                        ┌──────▼──────┐             ┌───────▼──────┐
                        │   MongoDB   │             │    Redis     │
                        │  (Database) │             │   (Cache)    │
                        └─────────────┘             └──────────────┘
```

## 📦 Component Details

### Frontend Layer
**Technology:** React 18 + TypeScript + Vite  
**Container:** Nginx Alpine  
**Port:** 80  
**Responsibilities:**
- User interface rendering
- Client-side routing
- State management
- API consumption
- Real-time updates (Socket.io)

**Key Features:**
- Bilingual (English/Urdu with RTL)
- Responsive design
- Progressive Web App capabilities
- Code splitting
- Lazy loading

### Backend Layer
**Technology:** Node.js + Express  
**Container:** Node Alpine  
**Port:** 5000  
**Responsibilities:**
- RESTful API endpoints
- Business logic
- Authentication & Authorization
- Data validation
- File processing
- Real-time communication
- Job scheduling

**API Modules:**
- `/api/v1/auth` - Authentication
- `/api/v1/users` - User management
- `/api/v1/listings` - Listing CRUD
- `/api/v1/bookings` - Booking management
- `/api/v1/payments` - Payment processing
- `/api/v1/messages` - Messaging
- `/api/v1/admin` - Admin operations

### Database Layer
**Technology:** MongoDB 7.0  
**Type:** Document Database  
**Port:** 27017  

**Collections:**
- `users` - User accounts
- `listings` - Rental listings
- `bookings` - Booking records
- `reviews` - Reviews & ratings
- `messages` - Chat messages
- `payments` - Payment transactions
- `categories` - Category definitions
- `sessions` - User sessions

**Features:**
- Indexing for performance
- Aggregation pipelines
- Text search
- Geospatial queries
- Transactions

### Cache Layer
**Technology:** Redis 7  
**Type:** In-Memory Cache  
**Port:** 6379  

**Usage:**
- Session storage
- API response caching
- Rate limiting data
- Real-time data
- Job queues

## 🔄 Data Flow

### User Registration Flow
```
User → Frontend → Backend → MongoDB
                     ↓
                  Email/SMS
                     ↓
                  OTP Sent
```

### Listing Creation Flow
```
User → Frontend → Backend → Cloudinary (Images)
                     ↓
                  MongoDB (Metadata)
                     ↓
                  Success Response
```

### Booking Flow
```
User → Frontend → Backend → Check Availability
                     ↓
                  Create Booking
                     ↓
                  Process Payment (Stripe)
                     ↓
                  Update Database
                     ↓
                  Send Notifications
                     ↓
                  Return Confirmation
```

## 🌐 Network Architecture

### Docker Compose Network
```
┌─────────────────────────────────────────────┐
│       urdu-rental-network (bridge)           │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Frontend │  │ Backend  │  │ MongoDB  │ │
│  │  :3000   │  │  :5000   │  │  :27017  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │             │               │       │
│       └─────────────┴───────────────┘       │
│                     │                       │
│              ┌──────▼──────┐               │
│              │    Redis    │               │
│              │    :6379    │               │
│              └─────────────┘               │
└─────────────────────────────────────────────┘
        │
        ▼
    Host Ports
    3000, 5000, 27017, 6379
```

### Kubernetes Network
```
┌─────────────────────────────────────────────────┐
│           Namespace: urdu-rental                 │
│                                                 │
│  ┌──────────────────────────────────────┐      │
│  │         Ingress Controller           │      │
│  │  Routes: /, /api, websockets        │      │
│  └──────────────┬───────────────────────┘      │
│                 │                               │
│     ┌───────────┴──────────────┐               │
│     │                           │               │
│  ┌──▼────────────┐   ┌─────────▼──────────┐   │
│  │ frontend-svc  │   │  backend-svc       │   │
│  │ ClusterIP:80  │   │  ClusterIP:5000    │   │
│  └──┬────────────┘   └─────────┬──────────┘   │
│     │                           │               │
│  ┌──▼────────────┐   ┌─────────▼──────────┐   │
│  │Frontend Pods  │   │  Backend Pods      │   │
│  │  (2-5 replicas)│  │  (2-10 replicas)  │   │
│  │  + HPA        │   │  + HPA            │   │
│  └───────────────┘   └─────────┬──────────┘   │
│                                 │               │
│                 ┌───────────────┴───────┐      │
│                 │                       │      │
│         ┌───────▼─────────┐   ┌────────▼─────┐│
│         │  mongodb-svc    │   │  redis-svc   ││
│         │  ClusterIP:27017│   │ClusterIP:6379││
│         └───────┬─────────┘   └────────┬─────┘│
│                 │                       │      │
│         ┌───────▼─────────┐   ┌────────▼─────┐│
│         │ MongoDB Pod     │   │  Redis Pod   ││
│         │ + PVC (10Gi)   │   │ + PVC (5Gi)  ││
│         └─────────────────┘   └──────────────┘│
└─────────────────────────────────────────────────┘
```

## 🔒 Security Architecture

### Authentication Flow
```
1. User Login
   ↓
2. Backend validates credentials
   ↓
3. Generate JWT (access + refresh tokens)
   ↓
4. Store refresh token in HTTP-only cookie
   ↓
5. Return access token to frontend
   ↓
6. Frontend stores access token
   ↓
7. Include token in all API requests
   ↓
8. Backend validates token
   ↓
9. Token expires → Use refresh token
```

### Security Layers
```
┌─────────────────────────────────────────┐
│  Layer 1: Network (Firewall, HTTPS)    │
├─────────────────────────────────────────┤
│  Layer 2: Ingress (Rate Limiting)      │
├─────────────────────────────────────────┤
│  Layer 3: Application (Authentication) │
├─────────────────────────────────────────┤
│  Layer 4: Authorization (RBAC)         │
├─────────────────────────────────────────┤
│  Layer 5: Data (Encryption at Rest)    │
└─────────────────────────────────────────┘
```

## 📊 Scaling Strategy

### Horizontal Scaling (Kubernetes)

**Frontend Pods:**
- Manual: 2-5 replicas
- Auto: CPU > 70%
- Load: Distributed by Service

**Backend Pods:**
- Manual: 2-10 replicas
- Auto: CPU > 70%, Memory > 80%
- Load: Distributed by Service

**Database:**
- MongoDB: Single replica (StatefulSet)
- Future: MongoDB Replica Set (3-5 nodes)

**Cache:**
- Redis: Single instance
- Future: Redis Cluster/Sentinel

### Vertical Scaling

**Resource Limits:**
```yaml
Backend:
  requests: {memory: 512Mi, cpu: 250m}
  limits:   {memory: 1Gi,   cpu: 1000m}

Frontend:
  requests: {memory: 128Mi, cpu: 100m}
  limits:   {memory: 256Mi, cpu: 500m}

MongoDB:
  requests: {memory: 512Mi, cpu: 250m}
  limits:   {memory: 2Gi,   cpu: 1000m}

Redis:
  requests: {memory: 256Mi, cpu: 100m}
  limits:   {memory: 512Mi, cpu: 500m}
```

## 💾 Data Persistence

### Volume Strategy

**MongoDB:**
- PVC: 10Gi
- StorageClass: Fast SSD
- Backup: Daily automated backups
- Retention: 30 days

**Redis:**
- PVC: 5Gi
- StorageClass: Standard
- AOF: Enabled
- Snapshots: Every 15 minutes

**Uploads:**
- External: Cloudinary CDN
- Local: Not stored in containers

## 🔄 Deployment Strategies

### Rolling Update
```
Current:  [v1.0] [v1.0] [v1.0]
          ↓
Step 1:   [v1.0] [v1.0] [v1.1]
          ↓
Step 2:   [v1.0] [v1.1] [v1.1]
          ↓
Final:    [v1.1] [v1.1] [v1.1]
```

**Configuration:**
- maxSurge: 1 (25%)
- maxUnavailable: 0 (0%)
- Zero downtime

### Blue-Green Deployment
```
Blue (Current):    [v1.0] [v1.0] [v1.0]  ← Traffic
Green (New):       [v1.1] [v1.1] [v1.1]  ← Testing

After validation, switch traffic to Green
```

### Canary Deployment
```
Stable: [v1.0] [v1.0] [v1.0] [v1.0]  ← 90% traffic
Canary: [v1.1]                         ← 10% traffic

If successful, gradually increase canary traffic
```

## 🔍 Monitoring & Observability

### Metrics Collection
```
Application Metrics
       ↓
   Prometheus
       ↓
    Grafana
       ↓
   Dashboards
```

**Key Metrics:**
- Request rate
- Error rate
- Response time
- Resource usage
- Active users
- Booking conversions

### Logging Architecture
```
Application Logs
       ↓
  FluentD/Fluentbit
       ↓
  Elasticsearch
       ↓
    Kibana
       ↓
   Log Analysis
```

### Health Checks

**Liveness Probe:**
- Checks if container is alive
- Restarts if failing

**Readiness Probe:**
- Checks if container can serve traffic
- Removes from service if failing

## 🌍 Multi-Region Architecture (Future)

```
┌──────────────┐         ┌──────────────┐
│  Region: US  │         │ Region: Asia │
│              │         │              │
│  Frontend ✓  │         │  Frontend ✓  │
│  Backend  ✓  │◄──────► │  Backend  ✓  │
│  MongoDB  ✓  │  Sync   │  MongoDB  ✓  │
│  Redis    ✓  │         │  Redis    ✓  │
└──────────────┘         └──────────────┘
       │                        │
       └────────┬───────────────┘
                │
         ┌──────▼──────┐
         │   Global    │
         │ Load Balancer│
         └─────────────┘
```

## 📈 Performance Optimization

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Caching strategies
- CDN usage
- Minification

### Backend
- Database indexing
- Query optimization
- Redis caching
- Connection pooling
- Async operations
- Response compression

### Database
- Proper indexing
- Query optimization
- Sharding (future)
- Read replicas (future)
- Aggregation optimization

## 🔄 CI/CD Pipeline

```
Developer Push
       ↓
   GitHub
       ↓
GitHub Actions
       ↓
  Build & Test
       ↓
 Build Images
       ↓
Push to Registry
       ↓
  Deploy to K8s
       ↓
  Run Tests
       ↓
   Notify Team
```

## 📱 Mobile Architecture (Future)

```
┌──────────────┐
│ Mobile Apps  │
│  iOS/Android │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  API Gateway │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│   Backend    │
│     API      │
└──────────────┘
```

## 🔐 Disaster Recovery

### Backup Strategy
1. **Database Backups:** Daily automated
2. **Configuration Backups:** Version controlled
3. **Image Backups:** Container registry
4. **Volume Snapshots:** Cloud provider

### Recovery Plan
1. Restore database from backup
2. Deploy from last known good images
3. Apply configuration
4. Verify functionality
5. Update DNS if needed

### RPO & RTO Targets
- **RPO:** 1 hour (maximum data loss)
- **RTO:** 4 hours (maximum downtime)

---

**This architecture supports:**
- High availability
- Horizontal scaling
- Zero-downtime deployments
- Disaster recovery
- Multi-region expansion (future)
- Microservices migration (future)
