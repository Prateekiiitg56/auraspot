# AuraSpot - AI-Powered Real Estate Marketplace

<div align="center">

![AuraSpot Banner](https://img.shields.io/badge/AuraSpot-Real%20Estate%20Marketplace-blue?style=for-the-badge&logo=home-assistant&logoColor=white)

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)
[![Cloudinary](https://img.shields.io/badge/Images-Cloudinary-3448C5?style=flat-square&logo=cloudinary)](https://cloudinary.com/)

**A modern, full-stack real estate platform with AI-powered property insights, intelligent matching, and comprehensive rental management.**

### Live Demo

* **Frontend:** [auraspot-frontend.vercel.app](https://auraspot-frontend.vercel.app/)
* **Backend API:** [auraspot-backend.vercel.app](https://auraspot-backend.vercel.app)

[Features](#features) • [Tech Stack](#tech-stack) • [Installation](#installation) • [API Documentation](#api-documentation) • [Deployment](#deployment)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [User Flows](#user-flows)
- [AI Features](#ai-features)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

AuraSpot is a comprehensive real estate marketplace that connects property owners with potential tenants and buyers. The platform leverages AI to provide intelligent property scoring, fraud risk detection, price suggestions, and personalized property matching.

### What Makes AuraSpot Special?

- **AI-Powered Insights**: Get instant property scores, fraud risk assessments, and fair rent suggestions.
- **Real-Time Chat**: Communicate directly with property owners before making decisions.
- **Analytics Dashboard**: Track rent collection, occupancy rates, and maintenance metrics.
- **Smart Notifications**: Automated rent reminders, status updates, and request updates.
- **Trust System**: Verified owners with ratings and trust badges.
- **Maintenance Tracking**: Complete maintenance request lifecycle management.

---

## Features

### Property Management

| Feature | Description |
|:---|:---|
| **Multi-Image Upload** | Upload up to 5 images per property listing |
| **Property Types** | Support for ROOM, PG, HOSTEL, FLAT, and HOME |
| **Dual Purpose** | List properties for RENT or SALE |
| **Location Mapping** | Store latitude/longitude with map display and location picker integrations |
| **Amenities Selection** | 16+ amenities including WiFi, AC, Parking, Gym, etc. |
| **Furnishing Options** | Furnished, Semi-Furnished, or Unfurnished |

### AI-Powered Features

| Feature | Description |
|:---|:---|
| **Property Score** | AI rates properties 0-100 based on location, price, amenities |
| **Fraud Detection** | Risk assessment (LOW/MEDIUM/HIGH) with specific flags |
| **Rent Suggestion** | AI recommends fair rent with market insights |
| **Smart Matching** | Match users to properties based on preferences |
| **Price Rating** | EXCELLENT to SUSPICIOUS price assessment |

### Rent Management

| Feature | Description |
|:---|:---|
| **Rent Agreements** | Create and manage formal rental contracts |
| **Payment Tracking** | Track monthly payments with payment request history |
| **Claim & Verify** | Tenant claims payment, owner verifies |
| **Auto Reminders** | 5-day, due-date, and overdue notifications |
| **Payment Status** | PAID, PENDING, or OVERDUE tracking |

### Maintenance System

| Feature | Description |
|:---|:---|
| **Request Categories** | Plumbing, Electrical, HVAC, Appliance, etc. |
| **Priority Levels** | LOW, MEDIUM, HIGH, URGENT |
| **Status Workflow** | PENDING -> APPROVED -> IN_PROGRESS -> RESOLVED |
| **Update Thread** | Communication history, comments, and status updates for each request |
| **Worker Assignment** | Assign service workers and add estimates |

---

## Tech Stack

### Frontend
- React 18 (UI Library)
- TypeScript (Type Safety)
- Vite (Build Tool)
- React Router v6 (Navigation)
- Firebase Auth (Authentication)
- CSS (Styling)
- Context API (State Management)

### Backend
- Node.js (Runtime)
- Express.js (Web Framework)
- MongoDB (Database)
- Mongoose (ODM)
- Multer (File Uploads)
- Cloudinary (Cloud Image Storage)

### AI Integration
- DeepSeek / Llama Models (via OpenRouter)
- In-memory caching with TTL

---

## Project Structure

```
AuraSpot/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/
│   │   ├── Chat.js               # Chat messages schema
│   │   ├── Maintenance.js        # Maintenance requests schema
│   │   ├── Notification.js       # System notifications schema
│   │   ├── Property.js           # Property listings schema
│   │   ├── Rating.js             # User ratings schema
│   │   ├── RentAgreement.js      # Rental contracts schema
│   │   └── User.js               # User profiles schema
│   ├── routes/
│   │   ├── aiRoutes.js           # AI endpoints
│   │   ├── analyticsRoutes.js    # Analytics endpoints
│   │   ├── authRoutes.js         # Auth endpoints
│   │   ├── chatRoutes.js         # Chat endpoints
│   │   ├── maintenanceRoutes.js  # Maintenance endpoints
│   │   ├── notificationRoutes.js # Notification endpoints
│   │   ├── propertyRoutes.js     # Property endpoints
│   │   ├── rentRoutes.js         # Rent management endpoints
│   │   └── userRoutes.js         # User endpoints
│   ├── services/
│   │   ├── aiService.js          # AI integration logic
│   │   └── cloudinaryService.js  # Cloud image upload service
│   ├── utils/
│   │   ├── scoreCalculator.js    # Property scoring utility
│   │   └── aiMatchEngine.js      # AI matching logic utility
│   ├── api/
│   │   └── index.js              # Vercel serverless entry point
│   ├── vercel.json               # Vercel deployment config
│   └── server.js                 # Express app entry
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx        # Navigation bar
│   │   │   ├── Footer.tsx        # Footer component
│   │   │   ├── PropertyCard.tsx  # Property card
│   │   │   ├── AIComponents.tsx  # AI display components
│   │   │   ├── MapDisplay.tsx    # Property location map rendering
│   │   │   └── MapPicker.tsx     # Location selection map
│   │   ├── context/
│   │   │   └── ThemeContext.tsx  # Dark/Light theme
│   │   ├── pages/
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
│   │   ├── App.tsx               # Main app routing
│   │   ├── App.css               # Global styles
│   │   ├── main.tsx              # Entry point
│   │   └── index.css             # Base styles
│   └── vite.config.ts
└── package.json                  # Workspace settings
```

---

## Installation

### Prerequisites
- Node.js >= 18.x
- MongoDB >= 6.x (local or Atlas)
- Firebase Project (for authentication)

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

# Configure environment variables in .env

# Start the server locally
node server.js
```
The backend will run on `http://localhost:5000`

### 3. Frontend Setup
```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
The frontend will run on `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/auraspot
DEEPSEEK_API_KEY=your_openrouter_api_key
DEEPSEEK_MODEL=tngtech/deepseek-r1t2-chimera:free
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## API Documentation

### Authentication Endpoints
| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Log in and authenticate a user |

### User Endpoints
| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/users/sync` | Sync Firebase user profile to MongoDB |
| GET | `/users/:email` | Get user profile metadata |
| PUT | `/users/:email` | Update user profile details |
| GET | `/users/stats/:userId` | Get success rates and badge information |

### Property Endpoints
| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/properties` | Create a property listing (multipart/form-data) |
| GET | `/properties` | Get currently active properties |
| GET | `/properties/all` | Get all listed properties |
| GET | `/properties/owner/:ownerId` | Get property listings created by owner |
| GET | `/properties/:id` | Get individual property details |
| DELETE | `/properties/:id` | Delete a property listing |
| POST | `/properties/:id/request` | Submit a request to buy or rent a property |
| POST | `/properties/:id/approve` | Approve a pending request |
| POST | `/properties/ai-match` | Perform property match suggestions |

### Notification Endpoints
| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/notifications` | Dispatch a system notification |
| GET | `/notifications/owner/:ownerId` | Fetch pending requests for an owner |
| GET | `/notifications/user/:userEmail` | Fetch notification history for a user |
| GET | `/notifications/check-request/:propertyId/:email` | Verify if user has already requested |
| POST | `/notifications/reject/:notificationId` | Reject a pending request |
| DELETE | `/notifications/cleanup/orphaned` | Clean up deleted property notifications |
| DELETE | `/notifications/:id` | Delete an individual notification |

### Chat Endpoints
| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/chat` | Send a new chat message |
| GET | `/chat/property/:propertyId` | Get messages filter by property and users |
| GET | `/chat/threads/:propertyId` | Get all active conversation threads for a property |
| GET | `/chat/conversations/:userEmail` | List all chats for a specific user |
| PUT | `/chat/read/:propertyId` | Mark messages for a property as read |
| GET | `/chat/unread/:userEmail` | Get unread message count |

### Rent Management Endpoints
| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/rent/create` | Set up a new rent agreement |
| GET | `/rent/owner/:email` | Get active agreements for owner |
| GET | `/rent/tenant/:email` | Get active agreements for tenant |
| GET | `/rent/:id` | Get rent agreement details |
| POST | `/rent/:id/request-payment` | Initiate a new payment request |
| POST | `/rent/:id/pay` | Claim that payment has been paid |
| POST | `/rent/:id/verify-payment` | Verify and approve a payment claim |
| POST | `/rent/:id/terminate` | Terminate an active agreement |
| GET | `/rent/process-reminders` | Trigger rent reminders computation (both GET/POST) |

### Maintenance Endpoints
| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/maintenance` | Request maintenance support |
| GET | `/maintenance/tenant/:email` | View requests submitted by tenant |
| GET | `/maintenance/owner/:email` | View requests received by owner |
| GET | `/maintenance/:id` | Get details of a maintenance request |
| PUT | `/maintenance/:id/status` | Update maintenance status |
| POST | `/maintenance/:id/assign-worker` | Assign worker and add budget cost |
| POST | `/maintenance/:id/comment` | Add comment thread update |
| POST | `/maintenance/:id/rate` | Rate maintenance work quality |

### AI Endpoints
| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/ai/score/:propertyId` | Calculate property rating score |
| GET | `/ai/fraud-check/:propertyId` | Detect fraud risk parameters |
| POST | `/ai/match` | Match properties to user preferences |
| GET | `/ai/rent-suggestion/:propertyId` | Get fair rent recommendations |

### Analytics Endpoints
| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/analytics/owner/:email` | Get owner analytics parameters |

---

## Database Schema

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

## User Flows

### Property Request Flow
1. User browses properties on the Explore page.
2. User clicks "Request to Rent/Buy" on the Property Details page.
   - Property remains AVAILABLE (others can still request).
   - Notification is sent to the property owner.
   - User sees "Request Sent" status.
3. Owner receives request in the Notification center.
   - Chat First: Option to discuss with the requester.
   - Accept: Mark property status as BOOKED.
   - Reject: Rejection notification is sent to the requester.
4. If Accepted:
   - Rent agreement is created automatically.
   - Tenant is notified of approval.
   - Property status is marked as BOOKED.

### Rent Payment Flow
1. Automated reminder sent 5 days before due date.
2. Tenant makes payment (externally).
3. Tenant clicks "Claim Payment" inside the Rent Manager dashboard.
4. Owner receives payment verification request notification.
5. Owner reviews and clicks "Confirm Payment".
   - Payment event is recorded in the history log.
   - Next payment date is calculated.
   - Payment status is set to PAID.
6. Cycle repeats monthly.

### Maintenance Request Flow
1. Tenant submits request specifying category (Plumbing, Electrical, etc.), priority (LOW -> URGENT), and issue description.
2. Owner receives notification; request status set to PENDING.
3. Owner reviews, assigns a service worker with estimates, and approves. Status updates to APPROVED.
4. Work proceeds, status updates to IN_PROGRESS. Owner and tenant can post updates/comments.
5. Issue is resolved; status updates to RESOLVED.
6. Tenant rates the service quality.

---

## AI Features

### Property Score (0-100)
- Location Quality (25%): City tier, area quality, connectivity.
- Price Fairness (25%): Comparison against local benchmark rates.
- Amenities (20%): Value/amenities density ratio.
- Demand Score (15%): View counts and engagement metrics.
- Owner Credibility (15%): Owner ratings and verification badges.

### Fraud Detection Flags
- Price significantly below local average rates.
- Newly registered accounts with high-value luxury properties.
- Ambiguous/copied descriptions.
- Empty location details.
- Suspicious amenity-to-price ratio.

### AI Match Algorithm
Filters properties by location, budget limits, user profile roles (Worker, Student, Family), and specific amenities checklist to return optimal matches categorized under:
- Top Matches (Highest suitability match).
- Budget Friendly (Best price value).
- Closest Matches (Nearest physical distance).

---

## Theme Support

Supports Dark and Light themes managed through the Context API:
```tsx
const { theme, toggleTheme } = useTheme();
```

---

## Automated Notifications

### Rent Reminders (Vercel Cron Integration)
Configured to trigger daily via the `/rent/process-reminders` endpoint:
- 5 days before due date: "Rent reminder: ₹X due in 5 days"
- Due date: "Rent due today: ₹X for [Property]"
- Overdue: "OVERDUE: Rent of ₹X was due X days ago"

### System Updates
- Request acceptance and rejections.
- Real-time message counts.
- Rent agreement creations.
- Maintenance update notifications.
- Payment confirmation updates.

---

## Trust Badge System

- **NEW_SELLER**: Default trust tier for new listings.
- **VERIFIED_OWNER**: Submitted verification documents.
- **TRUSTED_SELLER**: 5+ successful deals + 4.0+ average user rating.
- **TOP_SELLER**: 10+ deals + 4.5+ average rating + verified owner.

---

## Deployment

### Deploying to Vercel

AuraSpot uses a split deployment strategy: the frontend and backend are deployed as two independent Vercel projects.

#### Step 1: Deploy Backend
1. Go to Vercel and import the repository.
2. Select the `backend` folder as the root directory.
3. Configure Build Settings:
   - Framework Preset: `Other`
   - Install Command: `npm install`
4. Add environment variables:
   - `MONGODB_URI`, `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `OPENROUTER_API_URL`, `CORS_ORIGINS`, `NODE_ENV`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
5. Deploy and copy the live backend URL.

#### Step 2: Deploy Frontend
1. Import the same repository on Vercel.
2. Select the `frontend` folder as the root directory.
3. Configure Build Settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. Add environment variables:
   - `VITE_API_URL` (with your backend URL), and all Firebase client variables.
5. Deploy and copy the frontend URL.

#### Step 3: Configure CORS & Firebase
1. Set the backend `CORS_ORIGINS` variable on Vercel with your new frontend URL and redeploy.
2. Add your frontend domain to the Firebase Console under Authentication -> Settings -> Authorized domains.

---

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Authors

* **Prateek** - [GitHub](https://github.com/Prateekiiitg56)

---

## Acknowledgments

- React
- MongoDB
- Firebase
- DeepSeek
- OpenRouter
- Vite
