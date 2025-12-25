# 🚀 Quick Start Guide - Automated Setup

## 🎯 Two Options: Simple or Full Automation

### ⚡ **Option 1: Simple Auto-Start (Recommended for Testing)**

Just double-click or run:
```powershell
.\start-all.ps1
```

**What it does:**
- ✅ Automatically starts Redis
- ✅ Automatically starts HLS Worker
- ✅ Automatically starts Main Server
- ✅ Runs in background
- ✅ Shows status

**To stop everything:**
```powershell
.\stop-all.ps1
```

---

### 🎯 **Option 2: Windows Services (Recommended for Production)**

Run **once** as Administrator:
```powershell
.\setup-windows-services.ps1
```

**What it does:**
- ✅ Installs Redis as Windows Service
- ✅ Installs HLS Worker as Windows Service
- ✅ Installs Main Server as Windows Service
- ✅ **Auto-starts on Windows boot**
- ✅ Runs in background forever
- ✅ No need to run any commands again!

**Benefits:**
- 🔄 Survives reboots (auto-starts)
- 🛡️ Survives crashes (auto-restarts)
- 📊 Managed via Windows Services
- 📝 Automatic logging

---

## 📋 Prerequisites (One-Time Setup)

### 1. Install Redis
```powershell
choco install redis-64
```

**Don't have Chocolatey?**
- Install from: https://chocolatey.org/install
- Or download Redis manually: https://github.com/tporadowski/redis/releases

### 2. Install Dependencies
```powershell
npm install
```

### 3. Configure Environment
Make sure `.env` file has:
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
MONGODB_URI=mongodb://127.0.0.1:27017/movia
B2_ACCESS_KEY_ID=your_key
B2_SECRET_ACCESS_KEY=your_secret
B2_BUCKET=movia-prod
CDN_BASE=https://Xclub.b-cdn.net
```

---

## 🎬 Daily Usage

### With Simple Auto-Start:
```powershell
# Start everything
.\start-all.ps1

# Your site is now running!
# Open: http://localhost:5000

# When done, stop everything
.\stop-all.ps1
```

### With Windows Services:
```powershell
# Nothing! Services start automatically on boot
# Just restart your computer and everything works

# Check status:
Get-Service Movia-*

# View logs:
Get-Content logs\hls-worker.log -Tail 50
```

---

## 🔍 Monitoring

### Check Service Status:
```powershell
Get-Service Movia-*
```

### View Logs:
```powershell
# HLS Worker logs
Get-Content logs\hls-worker.log -Tail 50 -Wait

# Server logs
Get-Content logs\server.log -Tail 50 -Wait
```

### Check GPU Usage:
```powershell
nvidia-smi -l 1
```

### Check Queue:
```powershell
redis-cli
> LLEN bullmq:hls-processing:wait
> LLEN bullmq:hls-processing:active
```

---

## 🛠️ Troubleshooting

### Services won't start:
```powershell
# Check Redis
redis-cli ping

# Restart all services
Stop-Service Movia-*
Start-Service Movia-*

# Check logs for errors
Get-Content logs\*.log -Tail 100
```

### Re-install services:
```powershell
# Run as Administrator
.\setup-windows-services.ps1
```

---

## 📊 What Runs Automatically

| Service | What It Does | Auto-Start |
|---------|--------------|------------|
| Movia-Redis | Message queue | ✅ Yes |
| Movia-HLS-Worker | Processes videos with GPU | ✅ Yes |
| Movia-Server | Main API server | ✅ Yes |

---

## ✅ You're Done!

After running `setup-windows-services.ps1` **once**, everything is automatic:

✅ Services start when Windows boots  
✅ Services restart if they crash  
✅ Logs are automatically saved  
✅ No manual commands needed ever again  

**Just focus on your work - the system handles itself!** 🎉

---

## 📞 Scripts Available

| Script | Purpose | Run As |
|--------|---------|--------|
| `start-all.ps1` | Quick start (manual) | User |
| `stop-all.ps1` | Stop all services | User |
| `setup-windows-services.ps1` | Install as Windows services | **Administrator** |
| `start-hls-worker.ps1` | Start worker only | User |

---

**Need help?** Check the logs in `logs/` folder.
