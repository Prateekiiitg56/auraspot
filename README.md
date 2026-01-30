# 🏠 AuraSpot - AI-Powered Real Estate Marketplace

<div align="center">

![AuraSpot Banner](https://img.shields.io/badge/AuraSpot-Real%20Estate%20Marketplace-blue?style=for-the-badge&logo=home-assistant&logoColor=white)

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)

**A modern, full-stack real estate platform with AI-powered property insights, intelligent matching, and comprehensive rental management.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [API Documentation](#-api-documentation) • [Screenshots](#-screenshots)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [User Flows](#-user-flows)
- [AI Features](#-ai-features)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**AuraSpot** is a comprehensive real estate marketplace that connects property owners with potential tenants and buyers. The platform leverages AI to provide intelligent property scoring, fraud detection, price suggestions, and personalized property matching.

### What Makes AuraSpot Special?

- 🤖 **AI-Powered Insights** - Get instant property scores, fraud risk assessment, and fair rent suggestions
- 💬 **Real-Time Chat** - Communicate directly with property owners before making decisions
- 📊 **Analytics Dashboard** - Track rent collection, occupancy rates, and maintenance metrics
- 🔔 **Smart Notifications** - Automated rent reminders and request updates
- ⭐ **Trust System** - Verified owners with ratings and trust badges
- 🔧 **Maintenance Tracking** - Complete maintenance request lifecycle management

---

## ✨ Features

### 🏡 Property Management

| Feature | Description |
|---------|-------------|
| **Multi-Image Upload** | Upload up to 5 images per property listing |
| **Property Types** | Support for ROOM, PG, HOSTEL, FLAT, and HOME |
| **Dual Purpose** | List properties for RENT or SALE |
| **Location Mapping** | Store latitude/longitude for map integration |
| **Amenities Selection** | 16+ amenities including WiFi, AC, Parking, Gym, etc. |
| **Furnishing Options** | Furnished, Semi-Furnished, or Unfurnished |

### 🤖 AI-Powered Features

| Feature | Description |
|---------|-------------|
| **Property Score** | AI rates properties 0-100 based on location, price, amenities |
| **Fraud Detection** | Risk assessment (LOW/MEDIUM/HIGH) with specific flags |
| **Rent Suggestion** | AI recommends fair rent with market insights |
| **Smart Matching** | Match users to properties based on preferences |
| **Price Rating** | EXCELLENT → SUSPICIOUS price assessment |

### 💰 Rent Management

| Feature | Description |
|---------|-------------|
| **Rent Agreements** | Create and manage formal rental contracts |
| **Payment Tracking** | Track monthly payments with history |
| **Claim & Verify** | Tenant claims payment, owner verifies |
| **Auto Reminders** | 5-day, due-date, and overdue notifications |
| **Payment Status** | PAID, PENDING, or OVERDUE tracking |

### 🔧 Maintenance System

| Feature | Description |
|---------|-------------|
| **Request Categories** | Plumbing, Electrical, HVAC, Appliance, etc. |
| **Priority Levels** | LOW, MEDIUM, HIGH, URGENT |
| **Status Workflow** | PENDING → APPROVED → IN_PROGRESS → RESOLVED |
| **Update Thread** | Communication history for each request |
| **Vendor Tracking** | Store vendor info and estimated costs |

### 👤 User System

| Feature | Description |
|---------|-------------|
| **Dual Authentication** | Email/Password + Google Sign-In |
| **User Roles** | USER (tenant/buyer) or OWNER |
| **User Personas** | STUDENT, WORKER, or FAMILY profiles |
| **Trust Badges** | NEW_SELLER → VERIFIED_OWNER → TRUSTED_SELLER → TOP_SELLER |
| **Verification** | Aadhar, PAN, Driving License, Passport support |
| **Rating System** | Bi-directional tenant ↔ owner ratings |

### 📊 Analytics Dashboard

- Monthly rent collection vs expected
- 6-month rent trend charts
- Occupancy rate tracking
- Maintenance statistics
- Average response time
- Pending payment alerts

---

## 🛠 Tech Stack

### Frontend

```
React 18          - UI Library
TypeScript        - Type Safety
Vite              - Build Tool
React Router v6   - Navigation
Firebase Auth     - Authentication
CSS Modules       - Styling
Context API       - State Management (Theme)
```

### Backend

```
Node.js           - Runtime
Express.js        - Web Framework
MongoDB           - Database
Mongoose          - ODM
Multer            - File Uploads
node-cron         - Scheduled Tasks
```

### AI Integration

```
DeepSeek          - AI Model (via OpenRouter)
Model             - tngtech/deepseek-r1t2-chimera:free
Caching           - In-memory with 30-min TTL
```

### Authentication

```
Firebase Auth     - Authentication Provider
Google OAuth      - Social Login
Email/Password    - Traditional Login
```

---

## 📁 Project Structure

```
AuraSpot/
├── 📁 backend/
│   ├── 📁 config/
│   │   └── db.js                 # MongoDB connection
│   │
│   ├── 📁 controllers/
│   │   ├── authController.js     # Auth logic
│   │   └── propertyController.js # Property logic
│   │
│   ├── 📁 models/
│   │   ├── Chat.js               # Chat messages
│   │   ├── Maintenance.js        # Maintenance requests
│   │   ├── Notification.js       # System notifications
│   │   ├── Property.js           # Property listings
│   │   ├── Rating.js             # User ratings
│   │   ├── RentAgreement.js      # Rental contracts
│   │   └── User.js               # User profiles
│   │
│   ├── 📁 routes/
│   │   ├── aiRoutes.js           # AI endpoints
│   │   ├── analyticsRoutes.js    # Analytics endpoints
│   │   ├── authRoutes.js         # Auth endpoints
│   │   ├── chatRoutes.js         # Chat endpoints
│   │   ├── maintenanceRoutes.js  # Maintenance endpoints
│   │   ├── notificationRoutes.js # Notification endpoints
│   │   ├── propertyRoutes.js     # Property endpoints
│   │   ├── rentRoutes.js         # Rent management endpoints
│   │   └── userRoutes.js         # User endpoints
│   │
│   ├── 📁 services/
│   │   └── aiService.js          # DeepSeek AI integration
│   │
│   ├── 📁 utils/
│   │   ├── scoreCalculator.js    # Property scoring
│   │   └── aiMatchEngine.js      # AI matching logic
│   │
│   ├── 📁 uploads/               # Property images
│   ├── server.js                 # Express app entry
│   └── package.json
│
├── 📁 frontend/
│   ├── 📁 public/
│   │
│   ├── 📁 src/
│   │   ├── 📁 assets/            # Static assets
│   │   │
│   │   ├── 📁 components/
│   │   │   ├── Navbar.tsx        # Navigation bar
│   │   │   ├── Footer.tsx        # Footer component
│   │   │   ├── PropertyCard.tsx  # Property card
│   │   │   └── AIComponents.tsx  # AI display components
│   │   │
│   │   ├── 📁 context/
│   │   │   └── ThemeContext.tsx  # Dark/Light theme
│   │   │
│   │   ├── 📁 pages/
│   │   │   ├── home.tsx          # Landing page
│   │   │   ├── Explore.tsx       # Property browsing
│   │   │   ├── AddProperty.tsx   # Add listing
│   │   │   ├── PropertyDetails.tsx # Property view
│   │   │   ├── Profile.tsx       # User dashboard
│   │   │   ├── UserProfile.tsx   # Public profile
│   │   │   ├── Notifications.tsx # Notification center
│   │   │   ├── MyDeals.tsx       # Active transactions
│   │   │   ├── Chat.tsx          # Messaging
│   │   │   ├── AIMatch.tsx       # AI property finder
│   │   │   ├── RentManager.tsx   # Rent management
│   │   │   ├── Maintenance.tsx   # Maintenance requests
│   │   │   ├── Analytics.tsx     # Owner dashboard
│   │   │   ├── Login.tsx         # Login page
│   │   │   └── Signup.tsx        # Registration
│   │   │
│   │   ├── 📁 services/
│   │   │   ├── api.ts            # API base URL
│   │   │   └── firebase.ts       # Firebase config
│   │   │
│   │   ├── App.tsx               # Main app + routes
│   │   ├── App.css               # Global styles
│   │   ├── main.tsx              # Entry point
│   │   └── index.css             # Base styles
│   │
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── package.json                  # Root package
└── README.md                     # This file
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** >= 18.x
- **MongoDB** >= 6.x (local or Atlas)
- **Firebase Project** (for authentication)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/Prateekiiitg56/AuraSpot.git
cd AuraSpot
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure your environment variables (see below)

# Start the server
node server.js
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
# Open new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** → Sign-in methods:
   - Email/Password
   - Google
3. Get your config from Project Settings → General → Your apps
4. Update `frontend/src/services/firebase.ts` with your config

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/auraspot
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/auraspot

# Server Port (optional, defaults to 5000)
PORT=5000

# AI Service (OpenRouter)
DEEPSEEK_API_KEY=your_openrouter_api_key
```

### Frontend (`frontend/.env`)

```env
# API Base URL
VITE_API_URL=http://localhost:5000

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 📚 API Documentation

### Base URL

```
http://localhost:5000
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | Authenticate user |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users/sync` | Sync Firebase user to MongoDB |
| GET | `/users/:email` | Get user profile |
| PUT | `/users/:email` | Update user profile |

### Property Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/properties` | Create property (multipart/form-data) |
| GET | `/properties` | Get available properties |
| GET | `/properties/all` | Get all properties |
| GET | `/properties/owner/:ownerId` | Get owner's listings |
| GET | `/properties/:id` | Get property details |
| DELETE | `/properties/:id` | Delete property |
| POST | `/properties/:id/request` | Request to rent/buy |
| POST | `/properties/:id/approve` | Approve request |
| POST | `/properties/ai-match` | AI property matching |

### Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/notifications` | Create notification |
| GET | `/notifications/owner/:ownerId` | Get owner's requests |
| GET | `/notifications/user/:userEmail` | Get user's notifications |
| GET | `/notifications/check-request/:propertyId/:email` | Check existing request |
| POST | `/notifications/reject/:notificationId` | Reject request |
| DELETE | `/notifications/:id` | Delete notification |

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Send message |
| GET | `/chat/property/:propertyId` | Get conversation |
| GET | `/chat/conversations/:userEmail` | List all chats |
| PUT | `/chat/mark-read` | Mark as read |

### Rent Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/rent/create` | Create rent agreement |
| GET | `/rent/owner/:email` | Get owner's agreements |
| GET | `/rent/tenant/:email` | Get tenant's agreements |
| GET | `/rent/:id` | Get agreement details |
| POST | `/rent/:id/pay` | Confirm payment |
| POST | `/rent/:id/request-payment` | Claim payment |
| POST | `/rent/:id/terminate` | End agreement |

### Maintenance Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/maintenance` | Create request |
| GET | `/maintenance/tenant/:email` | Tenant's requests |
| GET | `/maintenance/owner/:email` | Owner's requests |
| GET | `/maintenance/:id` | Get request details |
| PUT | `/maintenance/:id/status` | Update status |
| POST | `/maintenance/:id/update` | Add comment |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai/score/:propertyId` | Get AI property score |
| GET | `/ai/fraud-check/:propertyId` | Check fraud risk |
| POST | `/ai/match` | AI property matching |
| GET | `/ai/rent-suggestion/:propertyId` | Get rent suggestion |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/owner/:email` | Get owner analytics |

---

## 🗄 Database Schema

### User Schema

```javascript
{
  name: String,
  email: String (unique, required),
  firebaseUid: String (unique, required),
  phone: String,
  location: String,
  bio: String,
  role: "USER" | "OWNER",
  persona: "STUDENT" | "WORKER" | "FAMILY",
  verified: Boolean,
  verificationDocuments: [{
    type: "AADHAR" | "PAN" | "DRIVING_LICENSE" | "PASSPORT",
    documentNumber: String,
    uploadedAt: Date
  }],
  socials: {
    facebook, twitter, linkedin, instagram, youtube: String
  },
  rating: Number (0-5),
  totalRatings: Number,
  successfulDeals: Number,
  trustBadge: "NEW_SELLER" | "VERIFIED_OWNER" | "TRUSTED_SELLER" | "TOP_SELLER"
}
```

### Property Schema

```javascript
{
  title: String,
  type: "ROOM" | "PG" | "HOSTEL" | "FLAT" | "HOME",
  purpose: "RENT" | "SALE",
  price: Number,
  city: String,
  area: String,
  images: [String] (max 5),
  latitude: Number,
  longitude: Number,
  amenities: [String],
  description: String,
  owner: ObjectId (ref: User),
  status: "AVAILABLE" | "REQUESTED" | "BOOKED" | "SOLD",
  assignedTo: ObjectId (ref: User),
  viewCount: Number,
  contactRequests: Number,
  propertyScore: Number (0-100),
  scoreBreakdown: {
    location, priceFairness, amenities, demand, ownerCredibility: Number
  },
  aiInsights: {
    score: Number,
    priceRating: String,
    locationQuality: String,
    highlights: [String],
    concerns: [String],
    summary: String,
    fraudRisk: String,
    fraudScore: Number,
    fraudFlags: [String],
    rentSuggestion: {
      suggestedRent, rentRange: { min, max }, marketInsight, negotiationTip
    },
    generatedAt: Date
  },
  bhk: Number,
  sqft: Number,
  furnishing: "Furnished" | "Semi-Furnished" | "Unfurnished"
}
```

### RentAgreement Schema

```javascript
{
  property: ObjectId (ref: Property),
  owner: ObjectId (ref: User),
  tenant: ObjectId (ref: User),
  rentAmount: Number,
  securityDeposit: Number,
  rentalStartDate: Date,
  rentalEndDate: Date,
  nextPaymentDate: Date,
  paymentCycleDay: Number (1-28),
  paymentStatus: "PAID" | "PENDING" | "OVERDUE",
  status: "ACTIVE" | "COMPLETED" | "TERMINATED",
  paymentHistory: [{
    amount: Number,
    paidDate: Date,
    paymentMonth: String,
    status: "PAID" | "PARTIAL" | "WAIVED",
    notes: String
  }],
  remindersSent: [{
    type: String,
    sentAt: Date,
    forPaymentDate: Date
  }]
}
```

---

## 🔄 User Flows

### Property Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. User browses properties on Explore page                 │
│                          ↓                                  │
│  2. User clicks "Request to Rent/Buy" on PropertyDetails    │
│     • Property stays AVAILABLE (others can also request)    │
│     • Notification sent to owner                            │
│     • User sees "Request Sent" status                       │
│                          ↓                                  │
│  3. Owner receives request in Notifications page            │
│     Options:                                                │
│     • 💬 "Chat First" → Discuss with requester              │
│     • ✓ "Accept" → Property becomes BOOKED                  │
│     • ✗ "Reject" → Requester notified                       │
│                          ↓                                  │
│  4. If Accepted:                                            │
│     • Rent Agreement created automatically                  │
│     • Tenant notified of acceptance                         │
│     • Property marked as BOOKED                             │
└─────────────────────────────────────────────────────────────┘
```

### Rent Payment Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Automated reminder sent 5 days before due date          │
│                          ↓                                  │
│  2. Tenant makes payment (external)                         │
│                          ↓                                  │
│  3. Tenant clicks "Claim Payment" in RentManager            │
│                          ↓                                  │
│  4. Owner receives payment verification request             │
│                          ↓                                  │
│  5. Owner clicks "Confirm Payment"                          │
│     • Payment logged in history                             │
│     • Next payment date calculated                          │
│     • Status updated to PAID                                │
│                          ↓                                  │
│  6. Cycle repeats next month                                │
└─────────────────────────────────────────────────────────────┘
```

### Maintenance Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Tenant submits request                                  │
│     • Selects category (Plumbing, Electrical, etc.)         │
│     • Sets priority (LOW → URGENT)                          │
│     • Describes issue                                       │
│                          ↓                                  │
│  2. Owner receives notification                             │
│     Status: PENDING                                         │
│                          ↓                                  │
│  3. Owner reviews and approves                              │
│     Status: APPROVED                                        │
│                          ↓                                  │
│  4. Work begins                                             │
│     Status: IN_PROGRESS                                     │
│     • Owner can add updates/comments                        │
│                          ↓                                  │
│  5. Issue fixed                                             │
│     Status: RESOLVED                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI Features

### How AI Scoring Works

The AI analyzes multiple factors to generate a property score:

```
Property Score (0-100)
├── Location Quality (25%)
│   ├── City tier (metro/non-metro)
│   ├── Area reputation
│   └── Connectivity
│
├── Price Fairness (25%)
│   ├── Comparison with market rates
│   ├── Price per sqft analysis
│   └── Value for amenities
│
├── Amenities (20%)
│   ├── Essential amenities present
│   ├── Luxury amenities
│   └── Amenity-price ratio
│
├── Demand Score (15%)
│   ├── View count
│   ├── Contact requests
│   └── Time on market
│
└── Owner Credibility (15%)
    ├── Verification status
    ├── Rating score
    └── Successful deals
```

### Fraud Detection Flags

The AI checks for suspicious patterns:

- 🚩 Price significantly below market rate
- 🚩 New account with luxury listing
- 🚩 Vague or copied descriptions
- 🚩 Missing location details
- 🚩 Unrealistic amenities for price
- 🚩 Stock photos detected

### AI Match Algorithm

```javascript
// User provides:
{
  preferredLocation: "Mumbai",
  budgetMin: 10000,
  budgetMax: 25000,
  purpose: "RENT",
  propertyType: "FLAT",
  userProfile: "WORKER",
  requiredAmenities: ["WiFi", "AC", "Parking"]
}

// AI returns categorized matches:
{
  topMatches: [...],      // Highest overall score
  budgetFriendly: [...],  // Best value for money
  closest: [...]          // Nearest to preferred location
}
```

---

## 🎨 Theme Support

AuraSpot supports **Dark** and **Light** themes:

```tsx
// ThemeContext provides:
{
  theme: "light" | "dark",
  toggleTheme: () => void
}

// Usage in components:
const { theme } = useTheme();
```

---

## 🔔 Automated Notifications

### Rent Reminders (Cron Job)

Runs every hour to check for:

| Timing | Action |
|--------|--------|
| 5 days before | "Rent reminder: ₹X due in 5 days" |
| Due date | "Rent due today: ₹X for [Property]" |
| Overdue | "OVERDUE: Rent of ₹X was due X days ago" |

### System Notifications

- ✅ Request accepted
- ❌ Request rejected
- 💬 New message received
- 📝 Rent agreement created
- 🔧 Maintenance request updates
- 💰 Payment confirmations

---

## 🏆 Trust Badge System

| Badge | Requirements |
|-------|--------------|
| 🆕 **NEW_SELLER** | Default for all new accounts |
| ✅ **VERIFIED_OWNER** | Submitted verification documents |
| ⭐ **TRUSTED_SELLER** | 5+ successful deals + 4.0+ rating |
| 👑 **TOP_SELLER** | 10+ deals + 4.5+ rating + verified |

---

## 🧪 Testing

```bash
# Backend testing
cd backend
npm test

# Frontend testing
cd frontend
npm test
```

---

## 📦 Deployment

### 🚀 Deploy to Vercel (Recommended)

AuraSpot uses a **separate deployment** strategy - frontend and backend are deployed as two different Vercel projects.

#### Step 1: Deploy Backend

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Go to [Vercel](https://vercel.com)** and sign in with GitHub

3. **Import your repository** and select the `backend` folder as root directory

4. **Configure Build Settings:**
   - Framework Preset: `Other`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Install Command: `npm install`

5. **Add Environment Variables** in Vercel Dashboard:
   | Variable | Value |
   |----------|-------|
   | `MONGODB_URI` | Your MongoDB Atlas connection string |
   | `DEEPSEEK_API_KEY` | Your OpenRouter API key |
   | `DEEPSEEK_MODEL` | `tngtech/deepseek-r1t2-chimera:free` |
   | `OPENROUTER_API_URL` | `https://openrouter.ai/api/v1/chat/completions` |
   | `CORS_ORIGINS` | Your frontend URL (add after frontend deploy) |
   | `NODE_ENV` | `production` |

6. **Deploy** - Note your backend URL (e.g., `https://auraspot-backend.vercel.app`)

#### Step 2: Deploy Frontend

1. **Create a new Vercel project** for the frontend

2. **Import the same repository** but select the `frontend` folder as root directory

3. **Configure Build Settings:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variables** in Vercel Dashboard:
   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | Your backend URL from Step 1 |
   | `VITE_FIREBASE_API_KEY` | Your Firebase API key |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID |
   | `VITE_FIREBASE_APP_ID` | Your app ID |
   | `VITE_FIREBASE_MEASUREMENT_ID` | Your measurement ID |

5. **Deploy** - Note your frontend URL

#### Step 3: Update Backend CORS

1. Go back to your **backend Vercel project**
2. Update the `CORS_ORIGINS` environment variable with your frontend URL
3. **Redeploy** the backend

#### Step 4: Update Firebase Auth

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Authentication → Settings → Authorized domains
3. **Add your Vercel frontend domain** (e.g., `auraspot.vercel.app`)

### 🐳 Alternative: Docker Deployment

#### Backend Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

#### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### ☁️ Alternative: Railway Deployment

1. Go to [Railway](https://railway.app)
2. Create new project → Deploy from GitHub
3. Add both `frontend` and `backend` as separate services
4. Add environment variables in Railway dashboard
5. Railway will auto-detect and deploy

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use **ESLint** for JavaScript/TypeScript
- Follow **Prettier** formatting
- Write meaningful commit messages
- Add comments for complex logic

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Prateek** - [GitHub](https://github.com/Prateekiiitg56)

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI Library
- [MongoDB](https://www.mongodb.com/) - Database
- [Firebase](https://firebase.google.com/) - Authentication
- [DeepSeek](https://deepseek.com/) - AI Model
- [OpenRouter](https://openrouter.ai/) - AI API Gateway
- [Vite](https://vitejs.dev/) - Build Tool

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ by Prateek

</div>
