# 🚀 Movia Deployment Instructions - Droplet (159.203.70.1)

## ✅ Changes Made

### 1. Logo Updated
- ✅ Changed from "X" icon to "M" letter
- ✅ Logo text shows "MOVIA" instead of "XCLUB"
- ✅ All colors and styling unchanged

### 2. Favicon Updated
- ✅ Changed from X mark to "M" letter
- ✅ Updated both `favicon.svg` and `favicon-dark.svg`

### 3. Branding Updated
- ✅ All "Xclub" references changed to "Movia"
- ✅ Login page: "Welcome to Movia"
- ✅ Register page: "Join Movia"
- ✅ Footer: "© 2025 Movia Inc."
- ✅ All meta tags updated

### 4. Upload Limit Fixed
- ✅ Backend: 2GB (2048MB)
- ✅ Nginx: 2500M (2.5GB buffer)
- ✅ Frontend: Shows "Max 2GB each"

### 5. Worker Dependencies Removed
- ✅ All worker/Redis configs removed
- ✅ Application runs standalone

## 📤 Deployment Steps

### Option 1: Using Git (Recommended)

```bash
# SSH into droplet
ssh root@159.203.70.1
# or
ssh ubuntu@159.203.70.1

# Navigate to project
cd /root/YT  # or /home/ubuntu/YT

# Pull latest code
git pull origin main

# Install dependencies
cd backend && npm install --production
cd ../client && npm install --production

# Build frontend
npm run build

# Update .env
cd /root/YT
nano .env
# Ensure: MAX_VIDEO_SIZE_MB=2048
# Remove: REDIS_HOST, REDIS_PORT, USE_WORKER_QUEUE, WORKER_URL

# Restart services
pm2 restart movia-backend
sudo systemctl restart nginx
```

### Option 2: Manual Upload

1. **Upload files via SCP**:
```bash
# Upload entire project (from your local machine)
scp -r -i "path/to/your-key.pem" . root@159.203.70.1:/root/YT/

# Or upload specific directories
scp -r -i "path/to/your-key.pem" client/build root@159.203.70.1:/root/YT/client/
scp -r -i "path/to/your-key.pem" backend root@159.203.70.1:/root/YT/
```

2. **Then SSH and setup**:
```bash
ssh root@159.203.70.1
cd /root/YT
# Follow steps from Option 1
```

### Option 3: Run Deployment Script

```bash
# Make script executable
chmod +x deploy-movia-to-droplet.sh

# Run deployment (update PEM file path in script first)
bash deploy-movia-to-droplet.sh
```

## ⚙️ Configuration on Droplet

### 1. Update .env File

```bash
cd /root/YT
nano .env
```

Ensure these settings:
```env
NODE_ENV=production
PORT=5000
MAX_VIDEO_SIZE_MB=2048

# Remove these if present:
# REDIS_HOST=
# REDIS_PORT=
# USE_WORKER_QUEUE=
# WORKER_URL=
# WORKER_ENABLED=
```

### 2. Update Nginx Config

```bash
sudo nano /etc/nginx/sites-available/movia
```

Ensure `client_max_body_size 2500M;` is set in both HTTP and HTTPS server blocks.

Then:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Restart Backend

```bash
cd /root/YT
pm2 restart movia-backend
pm2 logs movia-backend --lines 20
```

## ✅ Verification Checklist

After deployment, verify:

- [ ] Website loads: `http://159.203.70.1` or `https://xclub.asia`
- [ ] Logo shows "M" and "MOVIA" text
- [ ] Favicon shows "M" letter
- [ ] Login page shows "Welcome to Movia"
- [ ] Register page shows "Join Movia"
- [ ] Upload page shows "Max 2GB each"
- [ ] Can upload videos up to 2GB
- [ ] PM2 shows backend as `online`
- [ ] Backend health: `curl http://localhost:5000/api/health`

## 🔍 Troubleshooting

### If Upload Fails

1. **Check Nginx**:
   ```bash
   sudo grep "client_max_body_size" /etc/nginx/sites-available/movia
   # Should show: client_max_body_size 2500M;
   ```

2. **Check Backend**:
   ```bash
   grep MAX_VIDEO_SIZE_MB /root/YT/.env
   # Should show: MAX_VIDEO_SIZE_MB=2048
   ```

3. **Check Logs**:
   ```bash
   pm2 logs movia-backend --lines 50
   sudo tail -50 /var/log/nginx/error.log
   ```

### If Backend Not Starting

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs movia-backend --lines 50

# Common issues:
# 1. Missing .env file
# 2. MongoDB connection failed
# 3. Port 5000 in use

# Fix port issue
sudo lsof -i :5000
sudo kill -9 <PID>
pm2 restart movia-backend
```

## 📝 Quick Commands

```bash
# View PM2 status
pm2 status

# View logs
pm2 logs movia-backend

# Restart backend
pm2 restart movia-backend

# Restart nginx
sudo systemctl restart nginx

# Check backend health
curl http://localhost:5000/api/health

# Check nginx config
sudo nginx -t
```

---

**Status**: ✅ Ready for Deployment
**Changes**: Logo (M), Favicon (M), Branding (Movia), Upload Limit (2GB)






