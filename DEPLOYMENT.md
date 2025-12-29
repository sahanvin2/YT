# Deployment Guide

## EC2 Instance Information
- **Public IP:** 3.238.106.222
- **Private IP:** 172.30.5.141

## Quick Deployment Steps

### Option 1: Automated Deployment (Recommended)

1. **Make the script executable:**
   ```bash
   chmod +x deploy-ec2.sh
   ```

2. **Update the script with your SSH key path:**
   - Edit `deploy-ec2.sh`
   - Update `SSH_KEY_PATH` to your SSH key location
   - Update `APP_PATH` to your app directory on EC2

3. **Run the deployment:**
   ```bash
   ./deploy-ec2.sh
   ```

### Option 2: Manual Deployment

1. **Build and push to GitHub:**
   ```bash
   # Build frontend
   cd client
   npm install
   npm run build
   cd ..
   
   # Commit and push
   git add .
   git commit -m "Deploy: Latest changes"
   git push origin main
   ```

2. **SSH into EC2:**
   ```bash
   ssh -i ~/.ssh/your-key.pem ec2-user@3.238.106.222
   ```

3. **On EC2, run:**
   ```bash
   cd /path/to/your/app
   git pull origin main
   
   # Install dependencies
   cd client
   npm install
   npm run build
   cd ..
   npm install
   
   # Restart application
   pm2 restart all
   # OR
   sudo systemctl restart movia
   ```

## Environment Variables on EC2

Make sure your `.env` file on EC2 has:
- MongoDB connection string
- JWT secret
- B2 storage credentials (if using)
- Email service credentials
- Port configuration (default: 5001)

## Troubleshooting

1. **If SSH connection fails:**
   - Check your security group allows SSH (port 22)
   - Verify your SSH key has correct permissions: `chmod 400 ~/.ssh/your-key.pem`

2. **If build fails:**
   - Check Node.js version: `node --version` (should be 16+)
   - Clear node_modules: `rm -rf node_modules client/node_modules && npm install`

3. **If app doesn't start:**
   - Check logs: `pm2 logs` or `journalctl -u movia`
   - Verify port is not in use: `lsof -i :5001`

## GitHub Repository

Make sure your GitHub repository is up to date:
```bash
git remote -v  # Check remote URL
git push origin main  # Push to GitHub
```

