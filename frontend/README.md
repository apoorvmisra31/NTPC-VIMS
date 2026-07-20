# NTPC VIMS - Vendor Invoice Management System

## 🏭 Enterprise SAP-Integrated Invoice Management Platform

A comprehensive, full-stack enterprise web application simulating the NTPC Vendor Invoice Management System (VIMS), inspired by OpenText SAP VIM 7.6 SPS7 and the Flipper Vendor Portal.

## 📋 Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [User Roles](#user-roles)
- [Invoice Types](#invoice-types)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)

## ✨ Features

### Vendor Portal (Flipper Simulation)
- ✅ **7 Invoice Types**: PO Invoice, Advance Payment, Credit Memo, Retention Release, Subsequent Debit, Dispatch Payment, Custom Duty
- ✅ **Purchase Order Management**: View POs, line items, GR/SES status
- ✅ **PO Validation Service**: Real-time PO validation with auto-population
- ✅ **Digital Signature Validation**: PDF metadata checking for DS verification
- ✅ **Dynamic Document Checklist**: Type/subtype-based mandatory documents
- ✅ **Bank Details Selection**: Multiple bank accounts with primary selection
- ✅ **Payment Advice Download**: Automated payment advice PDF generation
- ✅ **SES Document Download**: Service Entry Sheet document retrieval
- ✅ **Vendor Sub-User Management**: Up to 4 sub-users per vendor
- ✅ **Vendor-NTPC Messaging**: Per-invoice threaded communication
- ✅ **6 Standard Reports**: Invoice status, payment status, login analytics

### VIM Workplace (SAP Back-End Simulation)
- ✅ **DP Document Processing**: 8-tab document interface (Basic Data, Line Items, Accounting, Tax, Process, Other Data, Cumulative, History)
- ✅ **Business Rules Engine**: Configurable exception flags with severity levels
- ✅ **Multi-Stage Approval Workflow**: VPD → EIC L1 → VPG L1 → Finance → Posting
- ✅ **Refer & Return to Vendor**: RTV process with email notifications
- ✅ **EIC/DAK Ingestion Channel**: Alternative invoice entry method
- ✅ **Priority Payment Flagging**: MSME, urgent, and SME prioritization
- ✅ **Cover Invoice Support**: Excel file upload for consolidated invoices
- ✅ **Third-Party Payment**: Payee configuration and payment method routing
- ✅ **Retention & Deduction Management**: Cumulative pay order calculation

### VIM Analytics
- ✅ **Multi-Dimensional Filtering**: Plant, TReDS, MSME, GeM, CAPEX/OPEX
- ✅ **Interactive Charts**: Status pie, trend line, plant volume bar, exception rate
- ✅ **Drill-Down Capability**: Click-to-filter detailed views
- ✅ **Excel/PDF Export**: Comprehensive report generation

### HR Portal
- ✅ **Leave Management**: Multiple leave types with approval workflow
- ✅ **Attendance Tracking**: In/out timestamps, monthly summaries
- ✅ **Travel & Reimbursement**: Multi-stage approval (Manager → Finance)

### Plant Monitoring
- ✅ **Real-Time Simulation**: Load, RPM, Temperature, Pressure, Efficiency
- ✅ **WebSocket Updates**: 60-second rolling window charts
- ✅ **Alert Thresholds**: Configurable min/max with alert history

### Admin Panel
- ✅ **Role-Based Access Control**: Granular permission management
- ✅ **Workflow Configuration**: Drag-and-drop approval chain builder
- ✅ **Document Checklist Config**: Type/subtype matrix configuration
- ✅ **Audit Log Viewer**: Comprehensive system activity tracking
- ✅ **Report Builder**: Cross-module report generation

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB (Atlas free tier compatible)
- **Authentication**: JWT (15-min access + 7-day refresh tokens)
- **Real-Time**: Socket.IO
- **File Upload**: Multer
- **Email**: Nodemailer
- **PDF Generation**: PDFKit, pdf-lib
- **Excel**: ExcelJS
- **Security**: Helmet, CORS, express-rate-limit

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **UI Library**: Ant Design 5
- **Routing**: React Router 6
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Real-Time**: Socket.IO Client
- **Charts**: Recharts
- **Date Handling**: Day.js
- **HTTP Client**: Axios

## 📁 Project Structure

```
ntpc-vims-platform/
├── backend/                      # Node.js Express backend
│   ├── config/                   # Database and environment configuration
│   ├── controllers/              # Route controllers
│   ├── middleware/               # Auth, upload, audit, error handling
│   ├── models/                   # Mongoose models
│   ├── routes/                   # API routes
│   ├── services/                 # Business logic services
│   ├── utils/                    # Utility functions
│   ├── uploads/                  # File uploads storage
│   ├── app.js                    # Express app setup
│   ├── server.js                 # Server entry point
│   └── package.json
│
├── frontend/                     # React frontend
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── api/                  # Axios configuration
│   │   ├── components/           # Reusable components
│   │   │   ├── common/           # Shared components
│   │   │   ├── vendor/           # Vendor portal components
│   │   │   ├── vim/              # VIM workplace components
│   │   │   ├── analytics/        # Analytics components
│   │   │   ├── hr/               # HR portal components
│   │   │   ├── plant/            # Plant monitoring components
│   │   │   └── admin/            # Admin panel components
│   │   ├── context/              # React contexts
│   │   ├── hooks/                # Custom hooks
│   │   ├── layouts/              # Layout components
│   │   ├── pages/                # Page components
│   │   ├── router/               # Route configuration
│   │   ├── theme/                # Theme configuration
│   │   ├── utils/                # Utility functions
│   │   ├── App.jsx               # Main app component
│   │   └── main.jsx              # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── README.md                     # This file
└── docker-compose.yml            # Docker configuration (optional)
```

## 🚀 Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Git

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Seed database with sample data
npm run seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## ⚙️ Configuration

### Backend Environment Variables (.env)

```env
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ntpc_vims
# For Atlas: mongodb+srv://username:password@cluster.mongodb.net/ntpc_vims

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=vimspayment@ntpc.co.in

# Frontend
FRONTEND_URL=http://localhost:5173

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend Environment Variables (.env)

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## 👥 User Roles

| Role | Access | Description |
|------|--------|-------------|
| **Vendor** | Flipper Portal | Submit invoices, view POs, download payment advice |
| **Vendor Sub-User** | Flipper Portal | Limited invoice submission rights |
| **VPD** | VIM Workplace | Validate DP documents, resolve exceptions |
| **EIC L1** | VIM Workplace | Engineer-in-Charge certification, GR/SES validation |
| **VPG L1** | VIM Workplace | Payment group approval, payment method configuration |
| **Finance** | VIM Workplace | Final financial approval, payment posting |
| **HR Admin** | HR Portal | Leave/travel approval, attendance management |
| **System Admin** | Full Access | User management, system configuration, reports |

## 📝 Invoice Types

### 1. PO Invoice (Standard)
- Standard purchase order-based invoice
- Subtypes: RAB (Running Account Bill), Final Bill

### 2. Advance Payment
- Pre-delivery payment for materials
- Material POs only

### 3. Credit Memo
- Credit note for previously invoiced items
- References original invoice

### 4. Retention Release
- Release of retention amounts
- Types: SD, Safety, MRC, COF, PGT, EIC Ret

### 5. Subsequent Debit
- Additional charges after original invoice

### 6. Dispatch Payment
- Payment at dispatch for material POs

### 7. Custom Duty
- Import customs and duties

## 🔌 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login
GET    /api/auth/me                # Get current user
POST   /api/auth/forgot-password   # Request password reset
POST   /api/auth/reset-password/:token  # Reset password
```

### Invoice Endpoints

```
POST   /api/invoices/po-invoice          # Submit PO invoice
POST   /api/invoices/advance-payment     # Submit advance payment
POST   /api/invoices/credit-memo         # Submit credit memo
GET    /api/invoices                     # Get all invoices
GET    /api/invoices/:id                 # Get single invoice
```

### Vendor Endpoints

```
GET    /api/vendor/purchase-orders       # Get vendor POs
GET    /api/vendor/purchase-orders/:poNumber  # Get PO details
POST   /api/vendor/validate-po           # Validate PO number
```

### Health Check

```
GET    /health                           # System health status
```

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

## 🔐 Default Test Credentials

After running `npm run seed` in the backend:

| Role | Email | Password |
|------|-------|----------|
| Vendor | vendor1@example.com | password123 |
| VPD | vpd@ntpc.co.in | password123 |
| EIC | eic@ntpc.co.in | password123 |
| VPG | vpg@ntpc.co.in | password123 |
| Finance | finance@ntpc.co.in | password123 |
| HR Admin | hradmin@ntpc.co.in | password123 |
| System Admin | admin@ntpc.co.in | password123 |

## 📦 Sample Data

The seed script creates:
- **8 Users**: 2 vendors, 6 NTPC internal users
- **3 Purchase Orders**: Various types and plants
- Pre-configured plants: Dadri, Rihand
- Bank details for vendors

## 🚢 Deployment

### Using Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment

#### Backend (Render.com, Railway, etc.)
1. Create new web service
2. Connect GitHub repository
3. Set environment variables
4. Deploy

#### Frontend (Vercel, Netlify, etc.)
1. Create new site
2. Connect GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables
6. Deploy

#### MongoDB (Atlas)
1. Create free cluster at mongodb.com
2. Get connection string
3. Update MONGODB_URI in backend .env

## 🤝 Contributing

This is an academic demonstration project. For improvements:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

MIT License - This is a simulation project for educational purposes.

## ⚠️ Disclaimer

This is a **SIMULATION PLATFORM** for academic demonstration. It is NOT a real SAP system and should not be used for production invoice processing. The system replicates NTPC Flipper Portal workflows for educational purposes only.

## 📧 Support

For questions or issues:
- Create an issue on GitHub
- Email: support@example.com

## 🙏 Acknowledgments

- Inspired by NTPC Flipper Portal (https://ebillpravesh.ntpc.co.in/flipper)
- Based on OpenText SAP VIM 7.6 SPS7
- Built for enterprise internship training

---

**Built with ❤️ for NTPC Limited**
