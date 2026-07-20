# NTPC VIMS Platform - Complete Project Guide

## 🏭 Project Overview

This is a **full-stack enterprise web application** simulating the NTPC Vendor Invoice Management System (VIMS), faithfully replicating the Flipper Vendor Portal and SAP VIM 7.6 SPS7 workflow system used by NTPC Limited.

### Key Highlights
- ✅ **7 Complete Invoice Types** with sub-workflows
- ✅ **Role-Based Access Control** (8 user roles)
- ✅ **Multi-Stage Approval Workflow** (VPD → EIC → VPG → Finance)
- ✅ **Real-Time Notifications** via Socket.IO
- ✅ **Document Management** with digital signature validation
- ✅ **VIM Analytics Dashboard** with interactive charts
- ✅ **HR Portal & Plant Monitoring** modules
- ✅ **Production-Ready Code** with security best practices

## 📦 What's Included

### Backend (Node.js + Express + MongoDB)
- RESTful API with 30+ endpoints
- JWT authentication with refresh tokens
- Multer file upload handling
- Email service (Nodemailer)
- PDF generation (PDFKit)
- Socket.IO real-time communication
- Comprehensive audit logging
- Seeded sample data

### Frontend (React + Vite + Ant Design)
- Modern React 18 with hooks
- Ant Design 5 UI components
- React Router 6 navigation
- Zustand state management
- React Query data fetching
- Socket.IO client for real-time updates
- Responsive design
- NTPC-themed interface

## 🚀 Quick Setup (5 Minutes)

### Prerequisites
```bash
# Required
- Node.js 18+ and npm
- MongoDB (local or Atlas account)
- Git

# Optional
- Docker Desktop (for containerized setup)
```

### Step 1: Extract and Navigate
```bash
unzip ntpc-vims-platform.zip
cd ntpc-vims-platform
```

### Step 2: Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your MongoDB URI
# For local: mongodb://localhost:27017/ntpc_vims
# For Atlas: mongodb+srv://username:password@cluster.mongodb.net/ntpc_vims

# Seed database with sample data
npm run seed

# Start backend server
npm run dev
```

Backend will run on: **http://localhost:5000**

### Step 3: Frontend Setup (New Terminal)
```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start frontend server
npm run dev
```

Frontend will run on: **http://localhost:5173**

### Step 4: Login and Test

Open **http://localhost:5173** and login with:

**Vendor Account:**
- Email: `vendor1@example.com`
- Password: `password123`

**Admin Account:**
- Email: `admin@ntpc.co.in`
- Password: `password123`

## 📝 Test Credentials (All Users)

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Vendor 1 | vendor1@example.com | password123 | Full vendor portal |
| Vendor 2 | vendor2@example.com | password123 | Full vendor portal |
| VPD | vpd@ntpc.co.in | password123 | VIM Workplace |
| EIC | eic@ntpc.co.in | password123 | VIM Workplace |
| VPG | vpg@ntpc.co.in | password123 | VIM Workplace |
| Finance | finance@ntpc.co.in | password123 | VIM Workplace |
| HR Admin | hradmin@ntpc.co.in | password123 | HR Portal |
| System Admin | admin@ntpc.co.in | password123 | Full system access |

## 🎯 Feature Walkthrough

### 1. Vendor Portal Features

**Dashboard**
- View 4 statistics cards (Open POs, Draft Invoices, Unpaid Invoices, Last 90 Days)
- Quick action buttons
- Recent activity feed

**Submit Invoice**
- 7 invoice types in tabs:
  1. **PO Invoice** - Standard purchase order invoice
  2. **Advance Payment** - Pre-delivery payment
  3. **Credit Memo** - Credit note for returns
  4. **Retention Release** - Release retention amounts
  5. **Subsequent Debit** - Additional charges
  6. **Dispatch Payment** - Payment at dispatch
  7. **Custom Duty** - Import duties
- Form validation and document upload
- PO validation service
- Bank details selection

**My Invoices**
- Sortable table with all invoices
- Status badges (Draft/Submitted/Approved/Posted/Paid/Rejected)
- Download payment advice
- Download SES documents
- Filter by date, status, PO number

**Purchase Orders**
- View all open and closed POs
- Line item details
- GR/SES quantities
- Balance quantities

### 2. VIM Workplace (Internal Users)

**DP Document Inbox**
- Three tabs: My Inbox, My Pending, My Completed
- Filter by vendor, DP-ID, plant, date
- Bulk actions and referrals

**DP Document Processing**
- 8 processing tabs:
  1. Basic Data
  2. Line Items
  3. Accounting
  4. Tax
  5. Process
  6. Other Data
  7. Cumulative Pay Order
  8. History (audit trail)
- Exception flag resolution
- Refer to other departments
- Return to vendor workflow
- Approval actions

### 3. Analytics Dashboard

- Interactive charts (pie, line, bar)
- Multi-dimensional filters
- Export to Excel/PDF
- Drill-down capability

### 4. HR Portal

- Leave management with approval
- Attendance tracking
- Travel claims
- Employee dashboard

## 🔧 Configuration Guide

### Backend Environment Variables (.env)

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/ntpc_vims
# Or for Atlas: mongodb+srv://username:password@cluster.mongodb.net/ntpc_vims

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-too
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Email Configuration (for password reset, notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=vimspayment@ntpc.co.in

# Frontend URL
FRONTEND_URL=http://localhost:5173

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend Environment Variables (.env)

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## 📊 Sample Data Created by Seed Script

**Users Created:**
- 2 Vendors (V001, V002)
- 1 VPD user
- 1 EIC user
- 1 VPG user
- 1 Finance user
- 1 HR Admin
- 1 System Admin

**Purchase Orders Created:**
- PO-2024-001 (Standard, Dadri, ₹5,90,000)
- PO-2024-002 (Service, Dadri, ₹3,54,000)
- PO-2024-003 (Standard, Rihand, ₹8,85,000)

All ready for invoice submission!

## 🐳 Docker Setup (Alternative)

If you prefer Docker:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This starts MongoDB, backend, and frontend in containers.

## 📡 API Endpoints Reference

### Authentication
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login
GET    /api/auth/me                # Get current user
POST   /api/auth/forgot-password   # Request password reset
POST   /api/auth/reset-password/:token  # Reset password
```

### Invoices
```
POST   /api/invoices/po-invoice          # Submit PO invoice
POST   /api/invoices/advance-payment     # Submit advance payment
POST   /api/invoices/credit-memo         # Submit credit memo
POST   /api/invoices/retention-release   # Submit retention release
GET    /api/invoices                     # Get all invoices
GET    /api/invoices/:id                 # Get single invoice
```

### Vendor
```
GET    /api/vendor/purchase-orders       # Get vendor POs
GET    /api/vendor/purchase-orders/:poNumber  # Get PO details
POST   /api/vendor/validate-po           # Validate PO number
```

### Health Check
```
GET    /health                           # System health
```

## 🔒 Security Features

- **JWT Authentication**: 15-minute access tokens + 7-day refresh tokens
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS Protection**: Whitelisted origins
- **Helmet Headers**: Security headers enabled
- **Input Validation**: express-validator on all POST routes
- **File Upload Restrictions**: Type and size limits
- **SQL Injection Prevention**: MongoDB parameterized queries
- **XSS Protection**: React auto-escaping + DOMPurify

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📱 Workflow Example: Submit Invoice as Vendor

1. **Login** as vendor1@example.com
2. Click **Submit Invoice**
3. Select **PO Invoice** tab
4. Enter invoice details:
   - Invoice Number: INV-2024-001
   - PO Number: PO-2024-001 (will auto-validate)
   - Invoice Date: Select date
   - Gross Amount: 100000
   - Tax Amount: 18000
   - Net Amount: 118000
5. Upload invoice PDF (digitally signed)
6. Upload supporting documents
7. Check document checklist items
8. Click **Submit Invoice**
9. View in **My Invoices** table

Invoice now appears in VPD inbox for processing!

## 🌐 Production Deployment

### Backend (Render/Railway/Heroku)
1. Push code to GitHub
2. Connect to hosting service
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)
1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variables
5. Deploy

### MongoDB (Atlas)
1. Create free cluster at mongodb.com
2. Configure network access (0.0.0.0/0)
3. Create database user
4. Get connection string
5. Update MONGODB_URI in backend

## 🐛 Troubleshooting

**MongoDB Connection Error**
```bash
# Check MongoDB is running
sudo systemctl status mongod

# Or start MongoDB
mongod --dbpath /your/db/path
```

**Port Already in Use**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env
```

**CORS Error**
- Ensure FRONTEND_URL in backend .env matches frontend URL
- Add frontend URL to ALLOWED_ORIGINS

**File Upload Fails**
- Check `backend/uploads` directory exists
- Verify MAX_FILE_SIZE in .env

**Seed Data Not Working**
```bash
cd backend
# Clear database first
mongo ntpc_vims --eval "db.dropDatabase()"
# Then seed again
npm run seed
```

## 📚 Additional Resources

**MongoDB Atlas Free Tier:**
- Create account: https://www.mongodb.com/cloud/atlas
- 500MB free storage
- Perfect for development and testing

**Email Setup (Gmail):**
1. Enable 2-factor authentication
2. Create app-specific password
3. Use in EMAIL_PASSWORD

**React DevTools:**
- Install browser extension for debugging
- View component hierarchy and state

## 🤝 Support & Contribution

This is an academic simulation project. For issues:
- Check troubleshooting section
- Review console logs (browser + terminal)
- Verify environment variables
- Check MongoDB connection

## 📄 Project Structure Summary

```
ntpc-vims-platform/
├── backend/                 # Node.js Express API
│   ├── config/              # DB and env configuration
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Auth, upload, audit, errors
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API endpoints
│   ├── services/            # Business logic
│   ├── utils/               # Helpers and utilities
│   ├── uploads/             # File storage
│   ├── app.js               # Express app
│   ├── server.js            # Server entry point
│   └── package.json         # Dependencies
│
├── frontend/                # React frontend
│   ├── src/
│   │   ├── api/             # Axios setup
│   │   ├── components/      # React components
│   │   ├── context/         # Context providers
│   │   ├── hooks/           # Custom hooks
│   │   ├── layouts/         # Layout components
│   │   ├── pages/           # Page components
│   │   ├── router/          # Route config
│   │   ├── theme/           # Theme config
│   │   ├── utils/           # Utilities
│   │   ├── App.jsx          # Main app
│   │   └── main.jsx         # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── README.md                # Main documentation
├── DEPLOYMENT.md            # Deployment guide
├── docker-compose.yml       # Docker configuration
└── start-dev.sh             # Quick start script
```

## ⚠️ Important Notes

1. **Simulation Platform**: This is NOT a real SAP system. For educational purposes only.
2. **Security**: Change all secrets before production deployment
3. **MongoDB Free Tier**: 500MB limit - sufficient for demo
4. **File Uploads**: Stored locally in development, use S3/Cloud Storage in production
5. **Email Service**: Configure SMTP for password reset functionality

## 🎓 Learning Outcomes

By exploring this project, you'll understand:
- ✅ Full-stack development with MERN stack
- ✅ JWT authentication and authorization
- ✅ File upload and processing
- ✅ Real-time communication with WebSockets
- ✅ Multi-stage workflow implementation
- ✅ Document management systems
- ✅ Enterprise UI/UX patterns
- ✅ Production-ready code structure

## 🏆 Features Completed

- [x] Vendor Portal (Flipper Simulation)
- [x] 7 Invoice Types with sub-workflows
- [x] Purchase Order Management
- [x] PO Validation Service
- [x] Digital Signature Validation
- [x] VIM Workplace (DP Document Processing)
- [x] Multi-Stage Approval Workflow
- [x] Business Rules & Exception Flags
- [x] Refer & Return to Vendor
- [x] Real-Time Notifications
- [x] Vendor-NTPC Messaging
- [x] VIM Analytics Dashboard
- [x] HR Portal (Leave/Attendance/Travel)
- [x] Plant Monitoring Simulation
- [x] Admin Panel
- [x] Comprehensive Audit Logging
- [x] Email Notifications
- [x] Payment Advice Generation
- [x] SES Document Download
- [x] Sub-User Management
- [x] 6 Vendor Reports
- [x] Responsive Design
- [x] NTPC Branding & Theme

## 📞 Contact & Support

For questions about this academic project:
- Email: support@example.com
- GitHub: [Create an issue]

---

**Built with ❤️ for NTPC Limited**
**Enterprise Internship Project | Full-Stack Web Application**
