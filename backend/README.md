# NTPC VIMS Backend API

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Seed database
npm run seed

# Run development server
npm run dev

# Run production server
npm start

# Run tests
npm test
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### Invoices
- `POST /api/invoices/po-invoice` - Submit PO invoice
- `POST /api/invoices/advance-payment` - Submit advance payment
- `POST /api/invoices/credit-memo` - Submit credit memo
- `POST /api/invoices/retention-release` - Submit retention release
- `GET /api/invoices` - Get invoices (filtered by user role)
- `GET /api/invoices/:id` - Get invoice details

### Vendor
- `GET /api/vendor/purchase-orders` - Get vendor's POs
- `GET /api/vendor/purchase-orders/:poNumber` - Get PO details
- `POST /api/vendor/validate-po` - Validate PO number

## Database Models

- **User**: Authentication and user profiles
- **PurchaseOrder**: Purchase order data
- **Invoice**: Invoice submissions
- **DPDocument**: DP workflow documents
- **Approval**: Approval history
- **Message**: Vendor-NTPC messages
- **Notification**: System notifications
- **AuditLog**: System audit trail
- **HRLeave**: HR leave requests
- **TravelClaim**: Travel reimbursement claims

## Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with express-validator
- File upload restrictions

## Monitoring

- Morgan HTTP request logging
- Audit logs for all critical actions
- Error tracking with stack traces (dev mode)
- Health check endpoint: `/health`
