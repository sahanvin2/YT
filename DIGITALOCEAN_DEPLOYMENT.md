# Digital Ocean Droplet Deployment Guide

## Server Information
- **IP Address**: 134.209.105.201
- **User**: root
- **Password**: @20040301Sa

## Quick Deployment Steps

### Step 1: Connect to Server

```bash
ssh root@134.209.105.201
# Password: @20040301Sa
```

### Step 2: Run Deployment Script

Once connected, run:

```bash
cd /root
wget https://raw.githubusercontent.com/sahanvin2/YT/main/deploy-digitalocean.sh
chmod +x deploy-digitalocean.sh
bash deploy-digitalocean.sh
```

**OR** if you have the script locally, upload it:

```bash
# From your local machine (Windows PowerShell)
scp deploy-digitalocean.sh root@134.209.105.201:/root/

# Then on server
ssh root@134.209.105.201
cd /root
chmod +x deploy-digitalocean.sh
bash deploy-digitalocean.sh
```

### Step 3: Configure Environment Variables

After deployment, edit the `.env` file:

```bash
nano /root/YT/.env
```

**Required Environment Variables:**

```env
NODE_ENV=production
PORT=5000

# MongoDB (REQUIRED)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/movia?retryWrites=true&w=majority

# JWT (REQUIRED)
JWT_SECRET=your_very_secure_random_secret_key_here
JWT_EXPIRE=30d

# Client URL
CLIENT_URL=http://134.209.105.201

# Backblaze B2 Storage (REQUIRED)
B2_BUCKET=your-bucket-name
B2_PUBLIC_BASE=https://f005.backblazeb2.com/file/your-bucket-name
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_ACCESS_KEY_ID=your_b2_access_key
B2_SECRET_ACCESS_KEY=your_b2_secret_key

# CDN (Optional but recommended)
CDN_BASE=https://Xclub.b-cdn.net

# File Upload
MAX_VIDEO_SIZE_MB=5120
```

**Save and exit**: `Ctrl+X`, then `Y`, then `Enter`

### Step 4: Restart Services

```bash
# Restart backend
pm2 restart backend

# Check status
pm2 status

# View logs
pm2 logs backend --lines 20
```

### Step 5: Verify Everything Works

1. **Check backend is running:**
   ```bash
   pm2 status
   # Should show: online
   ```

2. **Check nginx is running:**
   ```bash
   systemctl status nginx
   # Should show: active (running)
   ```

3. **Test the site:**
   - Open browser: http://134.209.105.201
   - Should see the Movia homepage

4. **Test API:**
   ```bash
   curl http://localhost:5000/api/health
   # Should return: {"status":"ok"}
   ```

## Manual Deployment (If Script Fails)

### 1. Update System

```bash
apt-get update -y
apt-get upgrade -y
```

### 2. Install Dependencies

```bash
# Essential packages
apt-get install -y curl wget git build-essential nginx ufw

# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# PM2
npm install -g pm2
```

### 3. Clone Repository

```bash
cd /root
git clone https://github.com/sahanvin2/YT.git
cd YT
```

### 4. Install Project Dependencies

```bash
# Backend
npm install

# Frontend
cd client
npm install
npm run build
cd ..
```

### 5. Configure Nginx

```bash
cat > /etc/nginx/sites-available/movia << 'EOF'
server {
    listen 80;
    server_name 134.209.105.201;

    # Frontend
    location / {
        root /root/YT/client/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 7200s;
        proxy_connect_timeout 7200s;
    }

    # Upload endpoint
    location /api/uploads/stream {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 7200s;
        proxy_connect_timeout 7200s;
        client_max_body_size 5120M;
    }

    client_max_body_size 5120M;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/movia /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart
nginx -t
systemctl restart nginx
systemctl enable nginx
```

### 6. Start Backend with PM2

```bash
cd /root/YT
pm2 start backend/server.js --name backend
pm2 save
pm2 startup
```

### 7. Configure Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
pm2 logs backend --lines 50

# Common issues:
# - Missing .env file
# - Wrong MongoDB URI
# - Missing B2 credentials
# - Port 5000 already in use
```

### Nginx 502 Error

```bash
# Check if backend is running
pm2 status

# Check nginx error logs
tail -f /var/log/nginx/error.log

# Restart backend
pm2 restart backend
```

### Files Not Uploading to B2

1. Check B2 credentials in `.env`
2. Verify B2 bucket exists and is accessible
3. Check backend logs: `pm2 logs backend`
4. Ensure `useTempFiles: false` in server.js (files should stream to B2)

### Site Not Loading

```bash
# Check nginx status
systemctl status nginx

# Check if frontend build exists
ls -la /root/YT/client/build

# Rebuild frontend if needed
cd /root/YT/client
npm run build
```

## Important Notes

1. **Files NEVER stored on server** - All uploads stream directly to B2
2. **No video processing** - Videos are stored as-is (no HLS encoding)
3. **PM2 auto-restart** - Backend will restart automatically if it crashes
4. **Nginx reverse proxy** - Handles routing and static files

## Maintenance Commands

```bash
# View backend logs
pm2 logs backend

# Restart backend
pm2 restart backend

# Stop backend
pm2 stop backend

# View nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Update code
cd /root/YT
git pull origin main
npm install
cd client && npm install && npm run build && cd ..
pm2 restart backend

# Clean temp files (should be empty, but just in case)
cd /root/YT
node backend/scripts/cleanup-temp-files.js
```

## Security Recommendations

1. **Change root password** after initial setup
2. **Set up SSH keys** instead of password authentication
3. **Enable firewall** (already done in script)
4. **Keep system updated**: `apt-get update && apt-get upgrade`
5. **Monitor logs** regularly: `pm2 logs backend`

