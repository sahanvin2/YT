# 🚀 EC2 Deployment Instructions

## Quick Deploy (Automated)

### Option 1: PowerShell Script (Windows)
```powershell
.\deploy-to-ec2.ps1
```

**Before running, update these in the script:**
- `$SSHKey` - Path to your EC2 SSH key (.pem file)
- `$AppPath` - Your app directory path on EC2 (default: `/home/ec2-user/Movia`)

### Option 2: Manual SSH Deployment

1. **SSH into your EC2 instance:**
   ```bash
   ssh -i ~/.ssh/your-key.pem ec2-user@3.238.106.222
   ```

2. **Once connected, run these commands:**
   ```bash
   cd /home/ec2-user/Movia  # Or your app path
   
   # Pull latest changes
   git pull origin main
   
   # Install and build frontend
   cd client
   npm install
   npm run build
   cd ..
   
   # Install backend dependencies
   npm install
   
   # Restart application
   pm2 restart all
   # OR if using systemd:
   sudo systemctl restart movia
   ```

## What Was Updated

✅ **Category Images Added:**
- All category images from "Categories images" folder are now used
- Images displayed on Home page category circles
- Images displayed on Explore/Category page with category names
- Fixed: Martial Arts, Superhero, and Documentary sub-category images

✅ **Files Changed:**
- `client/src/utils/categoryImages.js` - Image mapping
- `client/src/pages/Home/Home.js` - Uses actual images
- `client/src/pages/Category/CategoryPage.js` - Uses actual images
- `client/public/categories/` - All category images copied

## EC2 Configuration

- **Public IP:** 3.238.106.222
- **Private IP:** 172.30.5.141
- **Default User:** ec2-user (or ubuntu for Ubuntu instances)

## Troubleshooting

### If SSH fails:
1. Check security group allows SSH (port 22) from your IP
2. Verify SSH key permissions: `chmod 400 ~/.ssh/your-key.pem`
3. Check if key is correct: `ssh-keygen -y -f your-key.pem`

### If build fails:
1. Check Node.js version: `node --version` (should be 16+)
2. Clear cache: `rm -rf node_modules client/node_modules && npm install`
3. Check disk space: `df -h`

### If app doesn't start:
1. Check logs: `pm2 logs` or `journalctl -u movia -f`
2. Verify port: `lsof -i :5001`
3. Check environment variables in `.env` file

## Verification

After deployment, verify:
1. ✅ Home page shows category images in circles
2. ✅ Explore page shows category images with names
3. ✅ All categories have images (Martial Arts, Superhero, Documentary sub-category)
4. ✅ Images load correctly

---

**All changes are on GitHub and ready for deployment!** 🎉

