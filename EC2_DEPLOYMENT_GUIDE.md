# EC2 Deployment Guide for Movia

This guide will help you deploy your Movia video platform to AWS EC2 instance.

## Prerequisites
- EC2 instance running Ubuntu
- PEM key file: `movia.pem`
- Domain: `MOVIA.PUBLICVM.COM`
- SSH access to EC2 instance

---

## Step 1: Connect to Your EC2 Instance

From your local Windows machine, open PowerShell and connect:

```powershell
ssh -i "movia.pem" ubuntu@ec2-44-222-65-2.compute-1.amazonaws.com
```

---

## Step 2: Generate SSH Key on EC2 for GitHub

Once connected to EC2, run these commands:

```bash
# Generate a new SSH key pair
ssh-keygen -t ed25519 -C "ec2-movia-deployment" -f ~/.ssh/id_ed25519

# When prompted, press Enter to accept default location
# You can set a passphrase or leave it empty (press Enter twice)

# Display the public key (you'll need to copy this)
cat ~/.ssh/id_ed25519.pub
```

**Copy the entire output** - it should start with `ssh-ed25519` and end with `ec2-movia-deployment`

---

## Step 3: Add SSH Key to GitHub

1. Go to GitHub.com and sign in
2. Click your profile picture → **Settings**
3. In the left sidebar, click **SSH and GPG keys**
4. Click **New SSH key**
5. Fill in:
   - **Title**: `EC2 Movia Deployment`
   - **Key type**: `Authentication Key`
   - **Key**: Paste the public key you copied from Step 2
6. Click **Add SSH key**

---

## Step 4: Install Required Software on EC2

**Note:** Since you're using MongoDB Atlas (cloud database), you don't need to install MongoDB locally on EC2.

Run these commands on your EC2 instance:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Note: MongoDB Atlas is used (cloud database), no local MongoDB installation needed!

# Install Nginx (for reverse proxy and serving static files)
# Nginx is recommended for production because it:
# - Serves React static files efficiently
# - Acts as reverse proxy for API requests
# - Handles SSL/HTTPS easily
# - Provides better performance and security
sudo apt install -y nginx

# Install PM2 (process manager for Node.js)
sudo npm install -g pm2

# Install Git (if not already installed)
sudo apt install -y git
```

---

## Step 5: Clone Your Repository

```bash
# Navigate to home directory
cd ~

# Clone the repository using SSH
git clone git@github.com:sahanvin2/YT.git

# If SSH clone doesn't work, you can use HTTPS temporarily:
# git clone https://github.com/sahanvin2/YT.git

# Navigate into the project
cd YT
```

---

## Step 6: Install Project Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

---

## Step 7: Configure Backblaze B2 Storage (if not already done)

Your application uses **Backblaze B2** for storing all files (videos, thumbnails, images, etc.). You need to configure B2 credentials.

1. **Create/Login to Backblaze B2 Account:**
   - Go to [Backblaze B2](https://www.backblaze.com/b2/sign-up.html)
   - Sign up or login to your account

2. **Create a Bucket (if you don't have one):**
   - Go to B2 Cloud Storage → Buckets
   - Click "Create a Bucket"
   - Choose a bucket name (e.g., `movia-prod`)
   - Select bucket type: **Public** (for public file access)
   - Choose a region closest to your users
   - Click "Create a Bucket"

3. **Get Your B2 Credentials:**
   - Go to **App Keys** in B2 dashboard
   - Click "Add a New Application Key"
   - Key Name: `movia-ec2-production`
   - Allow access to: Your bucket name
   - Allow: Read and Write
   - Click "Create New Key"
   - **Copy the Key ID and Application Key** (you'll need these for .env)

4. **Get Your B2 Endpoint:**
   - Go to your bucket → Settings
   - Find "S3 Compatible API" section
   - Copy the **Endpoint** URL (e.g., `https://s3.us-west-000.backblazeb2.com`)

5. **Get Your Public URL:**
   - In your bucket settings, find the **Friendly URL** or **Download URL**
   - Format: `https://f000.backblazeb2.com/file/bucket-name`
   - This is your `B2_PUBLIC_BASE`

**Note:** All files (videos, images, inventory items, etc.) will be stored in the same B2 bucket using organized paths like:
- `videos/{userId}/{filename}` - Video files
- `thumbnails/{userId}/{filename}` - Thumbnail images
- `inventory/{userId}/{filename}` - Inventory item images
- `avatars/{userId}/{filename}` - User avatars

---

## Step 8: Configure MongoDB Atlas (if not already done)

1. **Get your MongoDB Atlas connection string:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/...`)

2. **Whitelist EC2 IP in MongoDB Atlas:**
   - Go to Network Access in Atlas dashboard
   - Click "Add IP Address"
   - **Get your EC2 Public IP** by running on EC2: `curl http://169.254.169.254/latest/meta-data/public-ipv4`
   - Add your EC2 instance's **Public IP** with `/32` suffix (e.g., `44.222.65.2/32`)
   - OR use `0.0.0.0/0` to allow all IPs (less secure but easier for testing)
   - Add a comment: "EC2 Production Server"
   - Click "Confirm"
   - Wait 1-2 minutes for changes to apply

3. **Update connection string:**
   - Replace `<password>` with your actual database password
   - Replace `<database>` with your database name (e.g., `movia`)

---

## Step 9: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add the following content (adjust as needed):

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/movia?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_to_random_string
JWT_EXPIRE=30d
CLIENT_URL=http://MOVIA.PUBLICVM.COM
FILE_UPLOAD_PATH=./uploads

# Backblaze B2 Storage Configuration (for videos, images, and all file uploads)
B2_BUCKET=your-b2-bucket-name
B2_PUBLIC_BASE=https://f000.backblazeb2.com/file/your-bucket-name
B2_ENDPOINT=https://s3.us-west-000.backblazeb2.com
B2_ACCESS_KEY_ID=your-b2-application-key-id
B2_SECRET_ACCESS_KEY=your-b2-application-key

# Optional: Video upload settings
MAX_VIDEO_SIZE_MB=500
```

**Important**: 
- **MongoDB Atlas:**
  - Replace `MONGO_URI` with your **MongoDB Atlas connection string**
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/database-name`
  - Get it from MongoDB Atlas → Connect → Connect your application
  - Make sure to whitelist EC2 IP (or 0.0.0.0/0 for all IPs) in Atlas Network Access

- **Backblaze B2 Storage (Required for file uploads):**
  - `B2_BUCKET`: Your B2 bucket name
  - `B2_PUBLIC_BASE`: Your B2 public URL (format: `https://f000.backblazeb2.com/file/bucket-name`)
  - `B2_ENDPOINT`: Your B2 S3-compatible endpoint (format: `https://s3.REGION.backblazeb2.com`)
  - `B2_ACCESS_KEY_ID`: Your B2 Application Key ID
  - `B2_SECRET_ACCESS_KEY`: Your B2 Application Key
  - Get these from Backblaze B2 → Buckets → Your Bucket → Settings

- **Security:**
  - Change `JWT_SECRET` to a long random string (generate with: `openssl rand -base64 32`)
  - Keep B2 credentials secure - never commit to git!

- Save and exit: `Ctrl+X`, then `Y`, then `Enter`

---

## Step 10: Build the React Frontend

```bash
# Build the React app for production
cd client
npm run build
cd ..
```

---

## Step 11: Configure Nginx (Recommended)

**Why Nginx?**
- Serves React static files efficiently (better than Express)
- Acts as reverse proxy for API requests
- Handles SSL/HTTPS easily with Let's Encrypt
- Better performance, security, and scalability
- Standard practice for production deployments

**Alternative (without Nginx):** 
If you prefer not to use Nginx, you can:
1. Configure Express to serve static React files (add to `backend/server.js`):
   ```javascript
   app.use(express.static(path.join(__dirname, '../client/build')));
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, '../client/build/index.html'));
   });
   ```
2. Access your site via `http://EC2-IP:5000` (not your domain)
3. Update Security Group to allow port 5000 instead of 80

**However, Nginx is strongly recommended** for production because it provides better performance, security, SSL support, and is the industry standard.

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/movia
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name MOVIA.PUBLICVM.COM;

    # Serve React static files
    location / {
        root /home/ubuntu/YT/client/build;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js backend
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
    }

    # Proxy video streaming
    location /uploads {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Save and exit, then:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/movia /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 12: Start the Application with PM2

```bash
# Navigate to project root
cd ~/YT

# Start the backend server with PM2
pm2 start backend/server.js --name movia-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions it provides (usually run a sudo command)
```

---

## Step 13: Configure AWS Security Group

Make sure your EC2 Security Group allows:
- **Port 80 (HTTP)** - Inbound from anywhere (0.0.0.0/0)
- **Port 443 (HTTPS)** - Inbound from anywhere (if using SSL)
- **Port 22 (SSH)** - Inbound from your IP only (for security)

---

## Step 14: Configure Domain DNS

In your domain registrar (where you manage MOVIA.PUBLICVM.COM):

1. Add an **A Record**:
   - **Name**: `@` or `MOVIA.PUBLICVM.COM`
   - **Type**: `A`
   - **Value**: Your EC2 instance's **Public IP address** (find it in AWS Console)
   - **TTL**: 3600 (or default)

2. Wait for DNS propagation (can take a few minutes to 48 hours)

---

## Step 15: Verify Everything Works

```bash
# Check if Node.js server is running
pm2 status

# Check MongoDB Atlas connection (should show in PM2 logs if connected)

# Check if Nginx is running
sudo systemctl status nginx

# View application logs
pm2 logs movia-backend

# Check if port 5000 is listening
sudo netstat -tlnp | grep 5000
```

---

## Useful Commands for Maintenance

```bash
# View PM2 logs
pm2 logs movia-backend

# Restart the application
pm2 restart movia-backend

# Stop the application
pm2 stop movia-backend

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Restart Nginx
sudo systemctl restart nginx

# Check MongoDB Atlas connection status (view in PM2 logs)
```

---

## Troubleshooting

### If GitHub clone fails:
```bash
# Test SSH connection to GitHub
ssh -T git@github.com

# If it says "Permission denied", make sure you added the SSH key correctly
```

### If the website doesn't load:
1. Check EC2 Security Group allows port 80
2. Check Nginx is running: `sudo systemctl status nginx`
3. Check PM2 is running: `pm2 status`
4. Check domain DNS points to correct IP

### If you need to update the code:
```bash
cd ~/YT
git pull origin main
cd client
npm run build
cd ..
pm2 restart movia-backend
```

---

## Optional: Setup SSL/HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d MOVIA.PUBLICVM.COM

# Follow the prompts
# Certbot will automatically configure Nginx for HTTPS
```

---

## Summary Checklist

- [ ] Connected to EC2 instance
- [ ] Generated SSH key on EC2
- [ ] Added SSH key to GitHub
- [ ] Installed Node.js, Nginx, PM2 (MongoDB Atlas used - no installation needed)
- [ ] Cloned repository
- [ ] Installed dependencies
- [ ] Configured Backblaze B2 storage
- [ ] Created .env file with B2 credentials
- [ ] Built React frontend
- [ ] Configured Nginx
- [ ] Started application with PM2
- [ ] Configured Security Group
- [ ] Configured DNS
- [ ] Tested website access

---

**Your website should now be accessible at: http://MOVIA.PUBLICVM.COM**

