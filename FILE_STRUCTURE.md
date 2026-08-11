# File Structure - Urdu Rental Space

## 📂 Complete Project Structure

```
mudassir/
│
├── 📄 README.md                           # Main project documentation
├── 📄 QUICKSTART.md                       # 5-minute quick start guide
├── 📄 DEPLOYMENT.md                       # Detailed deployment instructions
├── 📄 DOCKER_KUBERNETES_SETUP.md          # Docker/K8s setup summary
├── 📄 ARCHITECTURE.md                     # System architecture docs
├── 📄 PROJECT_SUMMARY.md                  # Project completion summary
├── 📄 FILE_STRUCTURE.md                   # This file
├── 📄 Makefile                            # Command shortcuts
├── 📄 .gitignore                          # Git exclusions
│
├── 🐳 docker-compose.yml                  # Multi-container orchestration
├── 📄 .env.docker                         # Environment template
│
├── 📁 .github/                            # GitHub configuration
│   └── workflows/
│       ├── docker-build.yml               # CI: Build & push images
│       └── k8s-deploy.yml                 # CD: Deploy to Kubernetes
│
├── 📁 scripts/                            # Automation scripts
│   ├── deploy.sh                          # Deployment automation
│   └── health-check.sh                    # Health verification
│
├── ☸️  k8s/                               # Kubernetes manifests
│   ├── README.md                          # K8s-specific documentation
│   ├── namespace.yaml                     # Namespace definition
│   ├── configmap.yaml                     # Configuration data
│   ├── secrets.yaml                       # Sensitive credentials
│   ├── mongodb-deployment.yaml            # Database setup
│   ├── redis-deployment.yaml              # Cache setup
│   ├── backend-deployment.yaml            # Backend API + Service + HPA
│   ├── frontend-deployment.yaml           # Frontend + Service + HPA
│   ├── ingress.yaml                       # Load balancer rules
│   └── kustomization.yaml                 # Kustomize configuration
│
├── 📁 urdu-rent-space/                    # Frontend React App
│   ├── 🐳 Dockerfile                      # Frontend container image
│   ├── 📄 nginx.conf                      # Nginx web server config
│   ├── 📄 .dockerignore                   # Build exclusions
│   ├── 📄 package.json                    # Node dependencies
│   ├── 📄 package-lock.json               # Locked dependencies
│   ├── 📄 .env                            # Environment variables
│   ├── 📄 .env.example                    # Environment template
│   ├── 📄 vite.config.ts                  # Vite configuration
│   ├── 📄 tsconfig.json                   # TypeScript config
│   ├── 📄 tailwind.config.js              # Tailwind CSS config
│   ├── 📄 index.html                      # HTML entry point
│   │
│   ├── 📁 public/                         # Static assets
│   │   ├── favicon.ico
│   │   ├── placeholder.svg
│   │   └── robots.txt
│   │
│   └── 📁 src/                            # Source code
│       ├── App.tsx                        # Main app component
│       ├── App.css                        # Global styles
│       ├── index.css                      # Base styles
│       ├── main.tsx                       # React entry point
│       │
│       ├── 📁 components/                 # React components
│       │   ├── NavLink.tsx
│       │   ├── auth/
│       │   │   └── ProtectedRoute.tsx
│       │   ├── dashboard/
│       │   │   ├── AccountSettings.tsx
│       │   │   ├── DashboardOverview.tsx
│       │   │   ├── Disputes.tsx
│       │   │   ├── Earnings.tsx
│       │   │   ├── Messages.tsx
│       │   │   ├── MyBookings.tsx
│       │   │   ├── MyListings.tsx
│       │   │   ├── Verification.tsx
│       │   │   └── admin/
│       │   │       ├── AdminAnalytics.tsx
│       │   │       ├── AdminBookings.tsx
│       │   │       ├── AdminCategories.tsx
│       │   │       ├── AdminDashboard.tsx
│       │   │       ├── AdminDisputes.tsx
│       │   │       ├── AdminListings.tsx
│       │   │       ├── AdminUsers.tsx
│       │   │       └── AdminVerifications.tsx
│       │   ├── layout/
│       │   │   ├── Footer.tsx
│       │   │   ├── Header.tsx
│       │   │   └── Layout.tsx
│       │   └── ui/                        # Shadcn/ui components
│       │       ├── accordion.tsx
│       │       ├── alert-dialog.tsx
│       │       ├── alert.tsx
│       │       ├── avatar.tsx
│       │       ├── badge.tsx
│       │       ├── button.tsx
│       │       ├── card.tsx
│       │       ├── dialog.tsx
│       │       ├── input.tsx
│       │       ├── select.tsx
│       │       └── ... (40+ components)
│       │
│       ├── 📁 contexts/                   # React contexts
│       │   ├── AuthContext.tsx            # Authentication
│       │   └── LanguageContext.tsx        # Bilingual support
│       │
│       ├── 📁 hooks/                      # Custom React hooks
│       │   ├── use-mobile.tsx
│       │   └── use-toast.ts
│       │
│       ├── 📁 lib/                        # Utilities & configs
│       │   ├── api.ts                     # API client
│       │   ├── categories.ts              # Category definitions
│       │   ├── i18n.ts                    # Translations (EN/UR)
│       │   └── utils.ts                   # Helper functions
│       │
│       └── 📁 pages/                      # Route components
│           ├── Index.tsx                  # Home page
│           ├── Login.tsx
│           ├── Register.tsx
│           ├── VerifyOTP.tsx
│           ├── CategoryPage.tsx
│           ├── ListingDetail.tsx
│           ├── CreateListing.tsx
│           ├── Dashboard.tsx
│           ├── Payment.tsx
│           ├── PaymentMethods.tsx
│           ├── PaymentSuccess.tsx
│           ├── PaymentFailed.tsx
│           ├── Subscription.tsx
│           ├── UserProfile.tsx
│           └── NotFound.tsx
│
└── 📁 urdu-rent-space-backend/            # Backend Node.js API
    ├── 🐳 Dockerfile                      # Backend container image
    ├── 📄 .dockerignore                   # Build exclusions
    ├── 📄 package.json                    # Node dependencies
    ├── 📄 package-lock.json               # Locked dependencies
    ├── 📄 .env                            # Environment variables
    ├── 📄 .env.example                    # Environment template
    ├── 📄 README.md                       # Backend documentation
    │
    ├── 📁 scripts/                        # Utility scripts
    │   ├── createTestUsers.js
    │   ├── expireListings.js
    │   ├── makeSuperAdmin.js
    │   └── syncSubscriptions.js
    │
    └── 📁 src/                            # Source code
        ├── server.js                      # Express server entry
        │
        ├── 📁 config/                     # Configuration
        │   ├── database.js
        │   ├── cloudinary.js
        │   ├── stripe.js
        │   └── email.js
        │
        ├── 📁 models/                     # MongoDB schemas
        │   ├── User.js
        │   ├── Listing.js
        │   ├── Booking.js
        │   ├── Review.js
        │   ├── Message.js
        │   ├── Payment.js
        │   ├── Category.js
        │   └── Subscription.js
        │
        ├── 📁 controllers/                # Request handlers
        │   ├── authController.js
        │   ├── userController.js
        │   ├── listingController.js
        │   ├── bookingController.js
        │   ├── paymentController.js
        │   ├── messageController.js
        │   ├── adminController.js
        │   └── subscriptionController.js
        │
        ├── 📁 routes/                     # API routes
        │   ├── auth.js
        │   ├── users.js
        │   ├── listings.js
        │   ├── bookings.js
        │   ├── payments.js
        │   ├── messages.js
        │   ├── admin.js
        │   └── subscriptions.js
        │
        ├── 📁 middleware/                 # Express middleware
        │   ├── auth.js                    # Authentication
        │   ├── authorize.js               # Authorization
        │   ├── validation.js              # Input validation
        │   ├── errorHandler.js            # Error handling
        │   ├── rateLimiter.js             # Rate limiting
        │   └── upload.js                  # File upload
        │
        ├── 📁 services/                   # Business logic
        │   ├── emailService.js
        │   ├── smsService.js
        │   ├── uploadService.js
        │   ├── paymentService.js
        │   ├── notificationService.js
        │   └── cronService.js
        │
        ├── 📁 utils/                      # Helper functions
        │   ├── jwt.js
        │   ├── encryption.js
        │   ├── validators.js
        │   └── helpers.js
        │
        ├── 📁 sockets/                    # Socket.io
        │   └── chatSocket.js              # Real-time chat
        │
        └── 📁 templates/                  # Email templates
            ├── welcome.html
            ├── otp.html
            ├── booking-confirmation.html
            └── payment-receipt.html
```

## 📊 File Count Summary

### Docker & Kubernetes
- **Docker files:** 7 (Dockerfiles, docker-compose, configs)
- **Kubernetes manifests:** 9 (deployments, services, etc.)
- **CI/CD workflows:** 2 (build, deploy)
- **Scripts:** 2 (deploy, health-check)

### Documentation
- **Markdown files:** 8 (README, guides, references)
- **Configuration:** 2 (Makefile, .gitignore)

### Frontend (urdu-rent-space)
- **React components:** 60+ files
- **Pages:** 15 route components
- **Contexts:** 2 (Auth, Language)
- **Hooks:** 2 custom hooks
- **Utilities:** 4 library files
- **UI components:** 40+ Shadcn components

### Backend (urdu-rent-space-backend)
- **Models:** 8 MongoDB schemas
- **Controllers:** 8 request handlers
- **Routes:** 8 API route files
- **Middleware:** 6 Express middleware
- **Services:** 6 business logic services
- **Utils:** 4 helper modules
- **Sockets:** 1 real-time module
- **Templates:** 4 email templates
- **Scripts:** 4 utility scripts

## 🎯 Key Files Reference

### Must Configure
```
.env                                    # All environment variables
k8s/secrets.yaml                        # Kubernetes secrets
k8s/backend-deployment.yaml             # Update image reference
k8s/frontend-deployment.yaml            # Update image reference
k8s/ingress.yaml                        # Update domain
```

### Entry Points
```
urdu-rent-space/src/main.tsx            # Frontend entry
urdu-rent-space-backend/src/server.js   # Backend entry
docker-compose.yml                      # Docker orchestration
k8s/kustomization.yaml                  # Kubernetes entry
```

### Quick Access
```
Makefile                                # Command shortcuts
QUICKSTART.md                           # Get started fast
scripts/deploy.sh                       # One-click deploy
scripts/health-check.sh                 # Verify deployment
```

## 📝 Important Notes

### Files to Update Before Deployment

1. **Environment Variables:**
   - `.env` (Docker)
   - `k8s/secrets.yaml` (Kubernetes)

2. **Image References:**
   - `k8s/backend-deployment.yaml` (line ~15)
   - `k8s/frontend-deployment.yaml` (line ~15)

3. **Domain Configuration:**
   - `k8s/ingress.yaml` (hosts section)

### Files NOT to Commit
```
.env                                    # Contains secrets
.env.local                              # Local overrides
k8s/secrets.yaml                        # If using real values
node_modules/                           # Dependencies
dist/                                   # Build output
logs/                                   # Log files
```

### Generated Files (Not in Version Control)
```
node_modules/                           # npm dependencies
dist/                                   # Frontend build
build/                                  # Backend build
logs/                                   # Application logs
*.log                                   # Log files
.DS_Store                               # macOS metadata
```

## 🔍 Finding Files

### By Purpose

**Configuration:**
```
*.env, *.yaml, *.yml, *.json, *.conf
```

**Documentation:**
```
*.md (in root)
k8s/README.md
```

**Source Code:**
```
urdu-rent-space/src/**/*
urdu-rent-space-backend/src/**/*
```

**Build/Deploy:**
```
Dockerfile
docker-compose.yml
k8s/*.yaml
.github/workflows/*.yml
scripts/*.sh
```

### By Technology

**React/Frontend:**
```
urdu-rent-space/src/
```

**Node.js/Backend:**
```
urdu-rent-space-backend/src/
```

**Docker:**
```
*/Dockerfile
docker-compose.yml
*/.dockerignore
```

**Kubernetes:**
```
k8s/*.yaml
```

**CI/CD:**
```
.github/workflows/
```

## 🎨 Color Legend

- 📄 = Documentation/Config file
- 🐳 = Docker-related file
- ☸️  = Kubernetes directory
- 📁 = Directory
- 📊 = Data/Config
- 🔧 = Script/Tool

---

**Total Project Files:** 200+ files  
**Lines of Code:** ~15,000+ lines  
**Container Images:** 4 (frontend, backend, mongodb, redis)  
**Kubernetes Resources:** 15+ resources  
**Documentation Pages:** 8 comprehensive guides

**Ready to deploy!** 🚀
