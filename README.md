# StockTrack-project
# 📦 StockTrack — Inventory & Stock Management System
Full-stack MERN app with role-based access, profit tracking, and real-time stock alerts.

## 🔐 Login Credentials
| Role    | Username    | Password     |
|---------|-------------|--------------|
| Admin   | `admin`     | `admin_demo123`   |
| Manager | `rahul_mgr` | `manager123` |
| Staff   | `priya_stf` | `staff123`   |
| Manager | `manager_demo` | `manager_demo123` |
| Staff   | `staff_demo` | `staff_demo123`   |
| Manager | `manager_demo2` | `manager_demo123` |
| Staff   | `staff_demo` | `staff_demo123`   |

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ · MongoDB Atlas free account

### 1. Configure .env
```bash
cp backend/.env.example backend/.env
# Edit backend/.env — add your MONGO_URI and JWT_SECRET
cp frontend/.env.example frontend/.env
```

### 2. Install & Run
```bash
# Terminal 1 — Backend
cd backend && npm install && npm run dev
# → http://localhost:5000

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

### 3. Seed Database (first time)
```bash
cd backend && node utils/seeder.js
```

## ⚙️ backend/.env
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/stocktrack
JWT_SECRET=your_secret_change_me
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

## 🗂 Folder Structure
```
stocktrack/
├── backend/
│   ├── config/db.js
│   ├── controllers/     authController, productController, transactionController,
│   │                    supplierController, userController, reportController
│   ├── middleware/      authMiddleware, roleMiddleware, errorMiddleware
│   ├── models/          User, Product, Supplier, Transaction
│   ├── routes/          auth, products, suppliers, users, transactions, reports
│   ├── utils/seeder.js
│   └── server.js
└── frontend/
    └── src/
        ├── components/  Layout, Modal, ProtectedRoute, StatCard
        ├── context/     AuthContext
        ├── pages/       Login, Register, ForgotPassword, Dashboard,
        │                Inventory, Suppliers, Users, Purchases,
        │                Sales, Reports, Settings
        └── utils/       api.js, helpers.js
```

## 🔌 Key API Endpoints
```
POST   /api/auth/login              Public
POST   /api/auth/register           Public
POST   /api/auth/forgot-password    Public — returns OTP (simulated)
POST   /api/auth/verify-otp         Public
POST   /api/auth/reset-password     Public
GET    /api/auth/me                 Protected
PUT    /api/auth/me                 Protected
PUT    /api/auth/change-password    Protected

GET    /api/products                All roles
POST   /api/products                Admin only
PUT    /api/products/:id            Admin only
DELETE /api/products/:id            Admin only

POST   /api/transactions/sale       All roles (deducts stock, calculates profit)
POST   /api/transactions/purchase   All roles (adds stock)
GET    /api/transactions            All roles

GET    /api/reports/summary?range=7days    Admin + Manager
GET    /api/reports/sales-trend?range=...  Admin + Manager
GET    /api/reports/top-products           Admin + Manager
GET    /api/reports/low-stock              Admin + Manager
GET    /api/reports/profit                 Admin + Manager

PATCH  /api/users/:id/approve       Admin only
PATCH  /api/users/:id/reject        Admin only
```

## 💡 Key Features
- **3-tier MERN architecture** — React UI → Express API → MongoDB
- **Profit tracking** — costPrice on products, profit auto-calculated on every sale
- **Low stock notifications** — bell icon in topbar shows count; click to navigate
- **Restock from dashboard** — "Restock" button pre-selects product in Purchases
- **User dropdown** — Profile, Account Settings, Logout from top-right avatar
- **Date range filters** — Today / 7 days / 30 days / This month / All time
- **Export** — PDF (browser print) and CSV download from Reports
- **Role-based sidebars** — Admin/Manager/Staff each see different nav items
- **Staff auto-redirect** — Staff users land on /inventory, no empty dashboard
