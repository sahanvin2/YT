# Troubleshooting 500 Internal Server Error

## Problem
You're seeing a 500 error from Nginx, and PM2 shows the backend has restarted 8 times (↺ 8), which means the backend is crashing.

## Step-by-Step Diagnosis

### Step 1: Check PM2 Logs (Most Important!)

```bash
# View recent logs
pm2 logs movia-backend --lines 50

# Or view logs in real-time
pm2 logs movia-backend
```

This will show you **why the backend is crashing**. Common issues:
- Missing environment variables (B2 credentials, MongoDB URI)
- MongoDB connection failed
- B2 storage configuration error
- Port already in use
- Missing dependencies

### Step 2: Check if Backend is Actually Running

```bash
# Check if port 5000 is listening
sudo netstat -tlnp | grep 5000

# Or use ss command
sudo ss -tlnp | grep 5000
```

If nothing shows up, the backend isn't running.

### Step 3: Check Nginx Error Logs

```bash
# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Or view last 50 lines
sudo tail -50 /var/log/nginx/error.log
```

This shows what Nginx sees when trying to connect to the backend.

### Step 4: Verify .env File

```bash
# Check if .env file exists and has content
cat ~/YT/.env

# Make sure all required variables are set:
# - MONGO_URI
# - JWT_SECRET
# - B2_BUCKET
# - B2_PUBLIC_BASE
# - B2_ENDPOINT
# - B2_ACCESS_KEY_ID
# - B2_SECRET_ACCESS_KEY
```

### Step 5: Test Backend Manually

```bash
cd ~/YT
node backend/server.js
```

This will show you the exact error message in the terminal.

## Common Fixes

### Fix 1: Missing Environment Variables

If logs show "Missing required env variable", add them to .env:

```bash
nano ~/YT/.env
```

Make sure you have:
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/movia?retryWrites=true&w=majority
JWT_SECRET=your_secret_here
JWT_EXPIRE=30d
CLIENT_URL=http://MOVIA.PUBLICVM.COM
FILE_UPLOAD_PATH=./uploads

# B2 Storage (REQUIRED)
B2_BUCKET=your-bucket-name
B2_PUBLIC_BASE=https://f000.backblazeb2.com/file/your-bucket-name
B2_ENDPOINT=https://s3.us-west-000.backblazeb2.com
B2_ACCESS_KEY_ID=your-key-id
B2_SECRET_ACCESS_KEY=your-secret-key
MAX_VIDEO_SIZE_MB=500
```

### Fix 2: MongoDB Connection Failed

If MongoDB connection fails:
1. Check if MongoDB Atlas IP whitelist includes your EC2 IP
2. Verify the connection string is correct
3. Test connection: `mongosh "your-connection-string"`

### Fix 3: B2 Storage Error

If B2 storage fails:
1. Verify all B2 credentials are correct
2. Check if B2 bucket exists and is accessible
3. Verify B2 endpoint matches your region

### Fix 4: Restart Services After Fixing .env

```bash
# Stop PM2
pm2 stop movia-backend

# Restart with updated .env
pm2 restart movia-backend

# Check status
pm2 status

# View logs
pm2 logs movia-backend --lines 20
```

### Fix 5: Check Nginx Configuration

```bash
# Verify Nginx config
sudo nginx -t

# Check Nginx config file
sudo cat /etc/nginx/sites-available/movia

# Make sure it points to correct paths:
# - root /home/ubuntu/YT/client/build;
# - proxy_pass http://localhost:5000;
```

## Quick Diagnostic Commands

Run these in order:

```bash
# 1. Check PM2 status
pm2 status

# 2. Check PM2 logs (THIS IS KEY!)
pm2 logs movia-backend --lines 50

# 3. Check if backend is listening
sudo netstat -tlnp | grep 5000

# 4. Check Nginx error log
sudo tail -20 /var/log/nginx/error.log

# 5. Check .env file
cat ~/YT/.env | grep -v SECRET  # (hides secrets)

# 6. Test backend manually
cd ~/YT
node backend/server.js
```

## Expected Output When Working

When everything works:
- PM2 status shows: `status: online` with `↺ 0` (no restarts)
- `netstat` shows port 5000 is listening
- PM2 logs show: "✅ Server running in production mode on port 5000"
- PM2 logs show: "✅ MongoDB connected successfully"
- Nginx error log is empty or shows successful connections

