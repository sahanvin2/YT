# Fix MongoDB Atlas Connection Error

## Problem
Error: "Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you're trying to access the database from an IP that isn't whitelisted."

## Solution: Add EC2 IP to MongoDB Atlas Whitelist

### Step 1: Get Your EC2 Public IP Address

On your EC2 instance, run:
```bash
# Get your EC2 public IP
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

Or check in AWS Console:
- Go to EC2 → Instances
- Find your instance
- Copy the **Public IPv4 address** (should be something like `44.222.65.2`)

### Step 2: Add IP to MongoDB Atlas Network Access

1. **Go to MongoDB Atlas:**
   - Login at https://cloud.mongodb.com/
   - Select your project

2. **Navigate to Network Access:**
   - Click **"Network Access"** in the left sidebar
   - Or go to: https://cloud.mongodb.com/v2#/security/network/whitelist

3. **Add IP Address:**
   - Click **"Add IP Address"** button
   - Choose one of these options:

   **Option A: Add Your EC2 IP (Recommended for Production)**
   - Click **"Add Current IP Address"** (if you're on the same network)
   - OR manually enter: `44.222.65.2/32` (replace with your EC2 IP)
   - Add a comment: "EC2 Production Server"
   - Click **"Confirm"**

   **Option B: Allow All IPs (Easier for Testing)**
   - Enter: `0.0.0.0/0`
   - Add a comment: "Allow all IPs (testing)"
   - Click **"Confirm"**
   - ⚠️ **Warning:** This allows access from anywhere. Use only for testing!

4. **Wait for Changes to Apply:**
   - Changes usually take effect within 1-2 minutes
   - The status will show as "Active" when ready

### Step 3: Restart Your Backend

After adding the IP, restart PM2:

```bash
# Stop the backend
pm2 stop movia-backend

# Wait a few seconds, then restart
pm2 restart movia-backend

# Check logs to verify connection
pm2 logs movia-backend --lines 20
```

### Step 4: Verify Connection

You should see in the logs:
```
✅ MongoDB Connected: ac-g5hjofn-shard-00-00.ytwtfrc.mongodb.net
✅ Database: movia
✅ Server running in production mode on port 5000
```

If you still see errors, wait 2-3 minutes for Atlas to update, then try again.

## Quick Commands Summary

```bash
# 1. Get EC2 IP
curl http://169.254.169.254/latest/meta-data/public-ipv4

# 2. Add this IP to MongoDB Atlas Network Access
# (Do this in MongoDB Atlas web interface)

# 3. Restart backend
pm2 restart movia-backend

# 4. Check logs
pm2 logs movia-backend --lines 20

# 5. Check status
pm2 status
```

## Expected Result

After fixing, PM2 status should show:
- `status: online`
- `↺ 0` (no restarts - means it's stable!)

And logs should show successful MongoDB connection!

