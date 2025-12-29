# Localhost Setup Guide

## ✅ Server is Running Successfully!

The backend server has been configured to run on localhost without errors.

## Changes Made for Local Development

### 1. **B2 Storage - Made Optional**
- B2 storage is now optional for local development
- Files are stored locally in the `uploads/` directory when B2 is not configured
- No B2 credentials needed for local testing

### 2. **MongoDB - Default Local Connection**
- Defaults to `mongodb://127.0.0.1:27017/movia` if `MONGO_URI` is not set
- Make sure MongoDB is running locally

### 3. **HLS Processing - Removed**
- No GPU encoding required
- Direct MP4 upload and playback
- No Redis queue needed

## Running the Application

### Backend Server
```bash
# From project root
npm run server
# OR
cd backend
node server.js
```

Server runs on: **http://localhost:5000**

### Frontend Client
```bash
# From project root
npm run client
# OR
cd client
npm start
```

Frontend runs on: **http://localhost:3000**

### Run Both Together
```bash
npm run dev
```

## Environment Variables (Optional for Local Dev)

Create a `.env` file in the root directory if you want to customize:

```env
# MongoDB (optional - defaults to local)
MONGO_URI=mongodb://127.0.0.1:27017/movia

# Server Port (optional - defaults to 5000)
PORT=5000

# Client URL (optional)
CLIENT_URL=http://localhost:3000

# B2 Storage (optional for local dev)
# Leave these empty to use local file storage
# B2_BUCKET=
# B2_PUBLIC_BASE=http://localhost:5000/uploads
# B2_ENDPOINT=
# B2_ACCESS_KEY_ID=
# B2_SECRET_ACCESS_KEY=

# JWT Secret (required for auth)
JWT_SECRET=your-secret-key-here

# Redis (not needed - HLS processing removed)
REDIS_ENABLED=false
```

## Local File Storage

When B2 is not configured, uploaded files are stored in:
- `uploads/` directory in the project root
- Served at: `http://localhost:5000/uploads/`

## Testing

1. **Health Check**: http://localhost:5000/api/health
2. **Backend API**: http://localhost:5000/api/
3. **Frontend**: http://localhost:3000

## Troubleshooting

### MongoDB Not Running
```powershell
# Check MongoDB service
Get-Service -Name MongoDB

# Start MongoDB if not running
Start-Service -Name MongoDB
```

### Port Already in Use
- Change `PORT` in `.env` or `backend/server.js`
- Or kill the process using the port

### Frontend Can't Connect to Backend
- Make sure backend is running on port 5000
- Check `client/package.json` proxy setting is `http://localhost:5000`

## Features Working

✅ Video upload (direct MP4, no processing)  
✅ Video playback (MP4 files)  
✅ User authentication  
✅ Comments and likes  
✅ Subscriptions  
✅ Search  
✅ All existing features (except HLS processing)

## Notes

- HLS processing has been removed to eliminate GPU overhead
- Videos are uploaded directly as MP4 files
- No encoding/transcoding happens
- Videos are available immediately after upload
- Existing HLS videos will still work (backwards compatible)

