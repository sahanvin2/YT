# 🔄 PREVENT SERVICE LOOP - Quick Fix Guide

## ❌ The Problem: Service Loop
You were experiencing a loop where:
1. Start backend → HLS worker stops
2. Start HLS worker → Frontend stops
3. Start frontend → Backend stops
4. **ENDLESS LOOP** 😫

## ✅ The Solution: Proper Service Management

### 🚀 ONE-CLICK STARTUP (Recommended)
```powershell
.\start-all-services.ps1
```
This script:
- ✅ Checks all ports first
- ✅ Kills stuck processes properly
- ✅ Starts services in correct order
- ✅ Opens each service in its own terminal window
- ✅ Verifies everything is running

### 📊 Service Order (Important!)
Services MUST start in this order:
1. **Redis (WSL)** - Message queue (always start first)
2. **Backend Server** - API on port 5000
3. **HLS Worker** - GPU processing
4. **Frontend** - React app on port 3000

### 🛠️ Manual Startup (If You Need It)

#### Step 1: Start Redis
```powershell
wsl sudo service redis-server start
# Verify:
wsl redis-cli ping
# Should return: PONG
```

#### Step 2: Clean Ports (Important!)
```powershell
# Kill backend (port 5000)
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Kill frontend (port 3000)
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Wait 2 seconds
Start-Sleep -Seconds 2
```

#### Step 3: Start Backend (Terminal 1)
```powershell
cd D:\MERN\Movia
npm start
# Wait for: "✅ Server is running on port 5000"
```

#### Step 4: Start HLS Worker (Terminal 2)
```powershell
cd D:\MERN\Movia
npm run hls-worker
# Wait for: "✨ Status: Ready for processing"
```

#### Step 5: Start Frontend (Terminal 3)
```powershell
cd D:\MERN\Movia\client
npm start
# Wait for: "Compiled successfully!"
```

### ⚠️ NEVER DO THIS (Causes the Loop!)

❌ **DON'T** kill all node processes:
```powershell
# ❌ BAD - Kills ALL services at once!
Get-Process -Name node | Stop-Process -Force
```

❌ **DON'T** start services in wrong order:
```powershell
# ❌ BAD - Frontend before backend fails!
cd client && npm start
cd .. && npm start
```

❌ **DON'T** restart one service without checking others:
```powershell
# ❌ BAD - Might kill HLS worker accidentally!
npm start
```

### 🔍 Check Service Status
```powershell
# Quick health check
netstat -ano | Select-String ":5000|:3000"

# Detailed check
Get-Process -Name node | Select-Object Id, ProcessName, Path
```

### 🐛 If You Get Stuck in the Loop Again

**FULL RESET:**
```powershell
# 1. Kill ALL node processes
Get-Process -Name node | Stop-Process -Force

# 2. Wait 5 seconds
Start-Sleep -Seconds 5

# 3. Use the startup script
.\start-all-services.ps1
```

### 💡 Pro Tips

1. **Keep terminals open** - Don't close service terminal windows
2. **Use Ctrl+C once** - To gracefully stop a service
3. **Check logs first** - Look for errors before restarting
4. **One service at a time** - Don't rush the startup process
5. **Wait for initialization** - Each service needs time to start

### 🎯 Quick Verification

After starting all services, verify:
```powershell
# Backend
Test-NetConnection -ComputerName localhost -Port 5000

# Frontend  
Test-NetConnection -ComputerName localhost -Port 3000

# Redis
wsl redis-cli ping
```

All should return success ✅

### 📦 Current Status
- ✅ Redis: Running (WSL)
- ✅ Backend: Running on port 5000
- ✅ Frontend: Running on port 3000
- ✅ HLS Worker: Running with GPU ready

### 🌐 Access URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/videos
- Upload Page: http://localhost:3000/upload

---

**Remember:** Use `start-all-services.ps1` to avoid the loop! 🚀
