# NTPC VIMS Deployment Guide

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

## Local Development

### Option 1: Manual Setup

1. **Start MongoDB**
   ```bash
   mongod --dbpath /path/to/your/db
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run seed
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

### Option 2: Quick Start Script

```bash
chmod +x start-dev.sh
./start-dev.sh
```

## Production Deployment

### Backend Deployment (Render.com)

1. Create account on render.com
2. New Web Service → Connect GitHub
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Add Environment Variables:
   - `NODE_ENV=production`
   - `MONGODB_URI=your-atlas-connection-string`
   - `JWT_SECRET=your-secure-secret`
   - All other .env variables
5. Deploy

### Frontend Deployment (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend: `cd frontend`
3. Run: `vercel`
4. Follow prompts
5. Add environment variables in Vercel dashboard:
   - `VITE_API_URL=your-backend-url`
   - `VITE_SOCKET_URL=your-backend-url`
6. Deploy: `vercel --prod`

### MongoDB Atlas Setup

1. Create free account at mongodb.com
2. Create cluster
3. Configure Network Access (allow all: 0.0.0.0/0)
4. Create database user
5. Get connection string
6. Update MONGODB_URI in backend

## Docker Deployment

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Environment Variables Checklist

### Backend
- ✅ NODE_ENV
- ✅ PORT
- ✅ MONGODB_URI
- ✅ JWT_SECRET
- ✅ JWT_REFRESH_SECRET
- ✅ EMAIL_HOST
- ✅ EMAIL_PORT
- ✅ EMAIL_USER
- ✅ EMAIL_PASSWORD
- ✅ FRONTEND_URL
- ✅ ALLOWED_ORIGINS

### Frontend
- ✅ VITE_API_URL
- ✅ VITE_SOCKET_URL

## Post-Deployment

1. **Seed Database**
   ```bash
   npm run seed
   ```

2. **Test Login**
   - Vendor: vendor1@example.com / password123
   - Admin: admin@ntpc.co.in / password123

3. **Verify Features**
   - Login authentication
   - Invoice submission
   - PO viewing
   - Real-time notifications

## Troubleshooting

### MongoDB Connection Error
- Check MongoDB is running
- Verify connection string
- Check network access in Atlas

### CORS Error
- Add frontend URL to ALLOWED_ORIGINS
- Check backend is running
- Verify API_URL in frontend

### File Upload Error
- Check uploads directory exists
- Verify MAX_FILE_SIZE setting
- Check disk space

## Monitoring

- Backend health: `GET /health`
- Check logs: `docker-compose logs`
- MongoDB Atlas monitoring dashboard

## Backup

```bash
# Backup MongoDB
mongodump --uri="your-mongodb-uri" --out=backup/

# Restore MongoDB
mongorestore --uri="your-mongodb-uri" backup/
```
