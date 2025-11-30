# Fix Server Configuration Issues

## Problems Found:
1. Server running in "development mode" instead of "production"
2. Frontend URL set to `http://localhost:3000` instead of your domain
3. Server keeps restarting (↺ 165)

## Solution: Fix .env File

### Step 1: Check Current .env File

```bash
# View your current .env file (hiding secrets)
cat ~/YT/.env | grep -E "NODE_ENV|CLIENT_URL|PORT"
```

### Step 2: Edit .env File

```bash
nano ~/YT/.env
```

### Step 3: Make Sure These Settings Are Correct

Your `.env` file should have:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/movia?retryWrites=true&w=majority
JWT_SECRET=your_secret_here
JWT_EXPIRE=30d
CLIENT_URL=http://MOVIA.PUBLICVM.COM
FILE_UPLOAD_PATH=./uploads

# B2 Storage
B2_BUCKET=your-bucket-name
B2_PUBLIC_BASE=https://f000.backblazeb2.com/file/your-bucket-name
B2_ENDPOINT=https://s3.us-west-000.backblazeb2.com
B2_ACCESS_KEY_ID=your-key-id
B2_SECRET_ACCESS_KEY=your-secret-key
MAX_VIDEO_SIZE_MB=500
```

**Important Changes:**
- `NODE_ENV=production` (not development!)
- `CLIENT_URL=http://MOVIA.PUBLICVM.COM` (or your actual domain/IP)
- Make sure there are NO spaces around the `=` sign
- Make sure there are NO quotes around values (unless the value itself needs quotes)

### Step 4: Save and Exit

- Press `Ctrl+X`
- Press `Y` to confirm
- Press `Enter` to save

### Step 5: Restart PM2

```bash
# Stop the backend
pm2 stop movia-backend

# Delete the old process
pm2 delete movia-backend

# Start fresh
pm2 start backend/server.js --name movia-backend

# Save PM2 configuration
pm2 save

# Check status
pm2 status

# Check logs
pm2 logs movia-backend --lines 20
```

### Step 6: Verify Correct Configuration

You should now see in the logs:
```
✅ Server running in production mode on port 5000
✅ MongoDB connected successfully
🔗 Frontend URL: http://MOVIA.PUBLICVM.COM
```

And PM2 status should show:
- `status: online`
- `↺ 0` (no restarts - stable!)

## Common .env File Mistakes

❌ **Wrong:**
```env
NODE_ENV = production    # Space around =
CLIENT_URL="http://MOVIA.PUBLICVM.COM"    # Unnecessary quotes
NODE_ENV=development     # Wrong value
```

✅ **Correct:**
```env
NODE_ENV=production
CLIENT_URL=http://MOVIA.PUBLICVM.COM
```

## If Server Still Restarts

If the server keeps restarting after fixing .env:

1. **Check for other errors:**
```bash
pm2 logs movia-backend --err --lines 50
```

2. **Check if port 5000 is available:**
```bash
sudo netstat -tlnp | grep 5000
```

3. **Check B2 storage configuration:**
   - Make sure all B2 variables are set correctly
   - Check if B2 credentials are valid

4. **Test backend manually:**
```bash
cd ~/YT
node backend/server.js
```
This will show you the exact error message.

## Quick Fix Commands

```bash
# 1. Edit .env
nano ~/YT/.env

# 2. After saving, restart PM2
pm2 delete movia-backend
pm2 start backend/server.js --name movia-backend
pm2 save

# 3. Check logs
pm2 logs movia-backend --lines 20

# 4. Check status
pm2 status
```

