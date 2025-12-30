# Quick Deploy to Digital Ocean - Copy & Paste Commands

## Server Info
- **IP**: 134.209.105.201
- **User**: root
- **Password**: @20040301Sa

## Step-by-Step Deployment

### 1. Connect to Server

```bash
ssh root@134.209.105.201
# Enter password when prompted: @20040301Sa
```

### 2. Once Connected, Run These Commands (Copy & Paste All):

```bash
# Update system
apt-get update -y && apt-get upgrade -y

# Install essential packages
apt-get install -y curl wget git build-essential nginx ufw

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Clone repository
cd /root
git clone https://github.com/sahanvin2/YT.git
cd YT

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
npm run build
cd ..

# Create .env file (you'll need to edit this with your credentials)
cat > /root/YT/.env << 'ENVEOF'
NODE_ENV=production
PORT=5000
MONGO_URI=YOUR_MONGODB_URI_HERE
JWT_SECRET=YOUR_JWT_SECRET_HERE
JWT_EXPIRE=30d
CLIENT_URL=http://134.209.105.201
B2_BUCKET=YOUR_B2_BUCKET
B2_PUBLIC_BASE=YOUR_B2_PUBLIC_BASE
B2_ENDPOINT=YOUR_B2_ENDPOINT
B2_ACCESS_KEY_ID=YOUR_B2_ACCESS_KEY
B2_SECRET_ACCESS_KEY=YOUR_B2_SECRET_KEY
CDN_BASE=YOUR_CDN_BASE
MAX_VIDEO_SIZE_MB=5120
ENVEOF

# Edit .env file with your actual credentials
nano /root/YT/.env
# Press Ctrl+X, then Y, then Enter to save

# Configure Nginx
cat > /etc/nginx/sites-available/movia << 'NGINXEOF'
server {
    listen 80;
    server_name 134.209.105.201;

    location / {
        root /root/YT/client/build;
        try_files $uri $uri/ /index.html;
    }

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
NGINXEOF

# Enable site
ln -sf /etc/nginx/sites-available/movia /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx
systemctl enable nginx

# Start backend with PM2
cd /root/YT
pm2 start backend/server.js --name backend
pm2 save
pm2 startup

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Check status
pm2 status
systemctl status nginx
```

### 3. Verify Everything Works

```bash
# Check backend logs
pm2 logs backend --lines 20

# Test API
curl http://localhost:5000/api/health

# Check if site is accessible
curl http://134.209.105.201
```

### 4. Visit Your Site

Open in browser: **http://134.209.105.201**

## Important: Edit .env File

After running the commands above, you **MUST** edit the `.env` file with your actual credentials:

```bash
nano /root/YT/.env
```

Replace these placeholders:
- `YOUR_MONGODB_URI_HERE` → Your MongoDB connection string
- `YOUR_JWT_SECRET_HERE` → A secure random string
- `YOUR_B2_BUCKET` → Your B2 bucket name
- `YOUR_B2_PUBLIC_BASE` → Your B2 public URL
- `YOUR_B2_ENDPOINT` → Your B2 endpoint
- `YOUR_B2_ACCESS_KEY` → Your B2 access key ID
- `YOUR_B2_SECRET_KEY` → Your B2 secret access key
- `YOUR_CDN_BASE` → Your CDN URL (optional)

Then restart:
```bash
pm2 restart backend
```

## Troubleshooting

### Backend not starting?
```bash
pm2 logs backend --lines 50
```

### Nginx 502 error?
```bash
pm2 restart backend
systemctl restart nginx
```

### Site not loading?
```bash
# Rebuild frontend
cd /root/YT/client
npm run build
cd ..
pm2 restart backend
```

## All Done! 🎉

Your site should now be live at: **http://134.209.105.201**

