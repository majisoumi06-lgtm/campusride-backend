# CampusRide - Backend API Service

CampusRide is a full-stack, campus-focused ride-sharing platform that connects students needing rides with students who have available vehicles and are travelling along similar routes.

This folder contains the complete, production-ready Node.js & Express.js REST API service with MongoDB / Mongoose ODM.

---

## 🛠 Tech Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (v4.19+)
- **Database:** MongoDB & Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs hashing
- **Security & CORS:** Configurable CORS middleware, input sanitation, centralized error handling

---

## 📁 Project Architecture

```
campusride-backend/
├── config/
│   └── db.js                 # MongoDB connection logic
├── controllers/
│   ├── adminController.js    # System stats, user moderation, rides monitoring
│   ├── authController.js     # Register, login, me, forgot password
│   ├── bookingController.js  # Concurrency-safe booking, accept/reject/cancel
│   ├── notificationController.js # Real-time alerts & unread counters
│   ├── reviewController.js   # Star ratings & passenger/driver reviews
│   ├── rideController.js     # Create, search, filter, update, delete rides
│   └── userController.js     # Profile editing, password changing, public profiles
├── middleware/
│   ├── auth.js               # JWT verification & role authorization (Admin/Student)
│   └── errorHandler.js       # Centralized error handler & status mapper
├── models/
│   ├── Booking.js            # Booking schema with status & concurrency check
│   ├── Notification.js       # Student in-app notifications
│   ├── Review.js             # Ratings & reviews schema
│   ├── Ride.js               # Ride offers with location, vehicle, & seat tracking
│   └── User.js               # User schema with bcrypt hooks & roles
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── bookingRoutes.js
│   ├── notificationRoutes.js
│   ├── reviewRoutes.js
│   ├── rideRoutes.js
│   └── userRoutes.js
├── utils/
│   └── seedData.js           # Comprehensive sample dataset for testing
├── .env.example
├── package.json
└── server.js                 # Server entry point
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or newer)
- **MongoDB** (Local instance at `mongodb://127.0.0.1:27017` OR a free MongoDB Atlas cloud cluster)

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Verify or update the variables in `.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/campusride
JWT_SECRET=supersecretcampusridejwtkey2025_prod_secure
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```
> **Note for MongoDB Atlas:** Replace `MONGO_URI` with your connection string:
> `mongodb+srv://<username>:<password>@cluster0.mongodb.net/campusride?retryWrites=true&w=majority`

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed Demo Data
Populate the database with pre-configured student accounts, active rides, bookings, and an admin user:
```bash
npm run seed
```

### 5. Start the Server
- **Production mode:**
  ```bash
  npm start
  ```
- **Development mode (with auto-reload):**
  ```bash
  npm run dev
  ```

Server will run on `http://localhost:5000`.

---

## 🔑 Demo Accounts (After running seed script)

| Role | Name | Email | Password |
|---|---|---|---|
| **Administrator** | Campus Transport Admin | `admin@campusride.edu` | `Admin@123` |
| **Driver (Car)** | Alex Rivera | `alex@campusride.edu` | `Student@123` |
| **Driver (Car)** | Priya Sharma | `priya@campusride.edu` | `Student@123` |
| **Passenger** | Sarah Johnson | `sarah@campusride.edu` | `Student@123` |
| **Passenger** | David Kim | `david@campusride.edu` | `Student@123` |

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` - Create student account
- `POST /api/auth/login` - Authenticate and receive JWT
- `GET /api/auth/me` - Get current session user
- `POST /api/auth/forgot-password` - Request password recovery

### Rides
- `GET /api/rides` - Query rides (`origin`, `destination`, `date`, `minSeats`, pagination)
- `POST /api/rides` - Offer a new ride (Driver)
- `GET /api/rides/:id` - Detailed ride information & driver profile
- `PUT /api/rides/:id` - Update ride details (Driver only)
- `DELETE /api/rides/:id` - Cancel ride & notify passengers
- `GET /api/rides/my-rides` - List rides created by the current user

### Bookings
- `POST /api/bookings` - Request seat reservation (Concurrency-safe)
- `GET /api/bookings/my-bookings` - List user's bookings with status
- `PUT /api/bookings/:id/accept` - Driver accepts booking request
- `PUT /api/bookings/:id/reject` - Driver declines booking & releases seats
- `PUT /api/bookings/:id/cancel` - Passenger cancels booking & releases seats

### Reviews & Notifications
- `POST /api/reviews` - Rate and review a driver/passenger
- `GET /api/reviews/:userId` - Get user reviews
- `GET /api/notifications` - Get unread & recent user notifications
- `PUT /api/notifications/:id/read` - Mark single notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read

### Admin
- `GET /api/admin/dashboard` - High-level system metrics & recent activity
- `GET /api/admin/users` - Search & filter registered students
- `PUT /api/admin/users/:id/status` - Suspend or reactivate student account
- `GET /api/admin/rides` - System-wide ride inspection
- `GET /api/admin/bookings` - System-wide bookings log
