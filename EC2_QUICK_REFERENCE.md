# EC2 Quick Reference - Essential Commands

## Initial Connection
```bash
# From your local Windows PowerShell
ssh -i "movia.pem" ubuntu@ec2-44-222-65-2.compute-1.amazonaws.com
```

## Generate SSH Key for GitHub (First Time Only)
```bash
ssh-keygen -t ed25519 -C "ec2-movia-deployment" -f ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub
# Copy the output and add to GitHub → Settings → SSH and GPG keys
```

## Quick Setup (Run on EC2)
```bash
# Make script executable and run
chmod +x ec2-setup.sh
./ec2-setup.sh
```

## Manual Setup Commands

### Install Software
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# MongoDB Atlas (cloud) - no installation needed!
# Just configure MONGO_URI in .env file with your Atlas connection string

# Nginx & PM2
sudo apt install -y nginx
sudo npm install -g pm2
```

### Clone & Setup Project
```bash
cd ~
git clone git@github.com:sahanvin2/YT.git
cd YT
npm install
cd client && npm install && npm run build && cd ..
```

### Create .env File
```bash
nano ~/YT/.env
# Add your configuration including:
# - MONGO_URI (MongoDB Atlas)
# - B2_BUCKET, B2_PUBLIC_BASE, B2_ENDPOINT, B2_ACCESS_KEY_ID, B2_SECRET_ACCESS_KEY
# See EC2_DEPLOYMENT_GUIDE.md for details
```

### Start Application
```bash
cd ~/YT
pm2 start backend/server.js --name movia-backend
pm2 save
pm2 startup  # Follow instructions
```

## Nginx Configuration
```bash
# Create config
sudo nano /etc/nginx/sites-available/movia
# (Add configuration from EC2_DEPLOYMENT_GUIDE.md)

# Enable site
sudo ln -s /etc/nginx/sites-available/movia /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## Useful Commands

### Check Status
```bash
pm2 status                    # Check app status
pm2 logs movia-backend        # Check MongoDB Atlas connection (in logs)
sudo systemctl status nginx   # Check Nginx
```

### View Logs
```bash
pm2 logs movia-backend        # App logs
pm2 logs                      # All PM2 logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
pm2 restart movia-backend     # Restart app
sudo systemctl restart nginx # Restart Nginx
# MongoDB Atlas is cloud-based, no restart needed
```

### Update Code
```bash
cd ~/YT
git pull origin main
cd client && npm run build && cd ..
pm2 restart movia-backend
```

### Generate JWT Secret
```bash
openssl rand -base64 32
```

## Storage Configuration
- **Backblaze B2**: Used for all file storage (videos, images, inventory, etc.)
- **Required B2 Variables**:
  - `B2_BUCKET` - Your B2 bucket name
  - `B2_PUBLIC_BASE` - Public URL (e.g., `https://f000.backblazeb2.com/file/bucket-name`)
  - `B2_ENDPOINT` - S3-compatible endpoint
  - `B2_ACCESS_KEY_ID` - Application Key ID
  - `B2_SECRET_ACCESS_KEY` - Application Key
- Get credentials from: Backblaze B2 → App Keys

## Domain Configuration
- **Domain**: MOVIA.PUBLICVM.COM
- **EC2 IP**: Check in AWS Console → EC2 → Your Instance
- **DNS**: Add A record pointing domain to EC2 Public IP

## Security Group (AWS Console)
Allow inbound:
- Port 80 (HTTP) from 0.0.0.0/0
- Port 443 (HTTPS) from 0.0.0.0/0 (if using SSL)
- Port 22 (SSH) from your IP only

