# Architecture Documentation - Urdu Rental Space

## System Overview

The Urdu Rental Space is a full-stack, containerized application designed for scalability and high availability.

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet / Users                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                 │
     ┌──────▼─────┐                   ┌───────▼──────┐
     │  Frontend   │                  │   Backend    │
     │  (React)    │◄────REST API────▶│   (Node.js)  │
     │  Vercel     │                  │   Render     │
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
**Hosting:** Vercel (static SPA)  
**Dev Port:** 5173  
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
**Hosting:** Render  
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
│  Layer 2: API (Rate Limiting)          │
├─────────────────────────────────────────┤
│  Layer 3: Application (Authentication) │
├─────────────────────────────────────────┤
│  Layer 4: Authorization (RBAC)         │
├─────────────────────────────────────────┤
│  Layer 5: Data (Encryption at Rest)    │
└─────────────────────────────────────────┘
```

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
