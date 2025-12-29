# ⚡ Quick EC2 Deployment

## ✅ What's Done
- ✅ All category images added (including Martial Arts, Superhero, Documentary sub-category)
- ✅ Images displayed on Home page category circles
- ✅ Images displayed on Explore page with category names
- ✅ All changes pushed to GitHub

## 🚀 Deploy to EC2 (Choose One Method)

### Method 1: Automated Script (Easiest)

**On Windows (PowerShell):**
```powershell
.\deploy-to-ec2.ps1
```

**Before running, edit `deploy-to-ec2.ps1` and update:**
- Line 5: `$SSHKey = "C:\path\to\your\key.pem"`
- Line 7: `$AppPath = "/home/ec2-user/Movia"` (your app path on EC2)

### Method 2: Manual SSH (Most Reliable)

**Step 1: Open PowerShell/Terminal and SSH:**
```bash
ssh -i C:\path\to\your-key.pem ec2-user@3.238.106.222
```

**Step 2: Once connected, run:**
```bash
cd /home/ec2-user/Movia  # Change to your app directory

# Pull latest code
git pull origin main

# Build frontend
cd client
npm install
npm run build
cd ..

# Install backend dependencies
npm install

# Restart app
pm2 restart all
# OR
sudo systemctl restart movia
```

**Step 3: Verify it's working:**
- Check if app is running: `pm2 status` or `sudo systemctl status movia`
- Visit your site: `http://3.238.106.222` (or your domain)

## 📋 Checklist

After deployment, verify:
- [ ] Home page shows category images in circles
- [ ] Explore page shows category images with names
- [ ] Martial Arts category has image
- [ ] Superhero category has image  
- [ ] Documentary sub-category has image
- [ ] All images load correctly

## 🔧 If Something Goes Wrong

1. **Check logs:**
   ```bash
   pm2 logs
   # OR
   sudo journalctl -u movia -f
   ```

2. **Check if images are in public folder:**
   ```bash
   ls -la client/public/categories/
   ```

3. **Rebuild if needed:**
   ```bash
   cd client
   rm -rf build node_modules
   npm install
   npm run build
   ```

---

**Your site is now updated with beautiful category images!** 🎨✨

