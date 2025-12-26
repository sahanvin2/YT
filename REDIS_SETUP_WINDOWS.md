# Redis Setup for Windows - Movia Video Processing

## 🚨 CRITICAL: Redis Required for Video Processing

Redis is needed for:
- ✅ HLS video processing queue (BullMQ)
- ✅ Job management and tracking
- ✅ Worker communication

---

## Option 1: Memurai (Redis for Windows) - **RECOMMENDED**

### Step 1: Download Memurai
1. Go to [Memurai.com](https://www.memurai.com/)
2. Click **Download** (Free Developer Edition)
3. Download `Memurai-Developer-v4.x.x.msi`

### Step 2: Install Memurai
1. Run the installer
2. Accept license agreement
3. Choose installation path (default: `C:\Program Files\Memurai\`)
4. Click **Install**
5. Finish installation

### Step 3: Start Memurai Service
```powershell
# Check if service is running
Get-Service Memurai

# Start service if not running
Start-Service Memurai

# Set to start automatically
Set-Service -Name Memurai -StartupType Automatic
```

### Step 4: Verify Installation
```powershell
# Test connection
telnet 127.0.0.1 6379

# Or use redis-cli (if installed)
memurai-cli ping
# Should return: PONG
```

### Step 5: Configure `.env`
```env
# Redis Configuration (Memurai)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

✅ **Done!** Memurai is now running on Windows.

---

## Option 2: WSL2 + Redis (For Advanced Users)

### Step 1: Enable WSL2
```powershell
# Run as Administrator
wsl --install

# Restart computer
```

### Step 2: Install Ubuntu
```powershell
wsl --install -d Ubuntu
```

### Step 3: Install Redis in WSL
```bash
# Update packages
sudo apt update

# Install Redis
sudo apt install redis-server -y

# Start Redis
sudo service redis-server start

# Enable auto-start
sudo systemctl enable redis-server
```

### Step 4: Configure Redis for Windows Access
```bash
# Edit redis.conf
sudo nano /etc/redis/redis.conf

# Find and change:
bind 127.0.0.1 ::1  →  bind 0.0.0.0

# Save and exit (Ctrl+X, Y, Enter)

# Restart Redis
sudo service redis-server restart
```

### Step 5: Get WSL IP Address
```bash
# Get IP address
ip addr show eth0 | grep inet | awk '{print $2}' | cut -d/ -f1
# Example output: 172.24.160.1
```

### Step 6: Configure `.env`
```env
# Redis Configuration (WSL2)
REDIS_HOST=172.24.160.1
REDIS_PORT=6379
```

---

## Option 3: Docker Desktop (Easiest but requires Docker)

### Step 1: Install Docker Desktop
1. Download from [docker.com](https://www.docker.com/products/docker-desktop)
2. Install and restart computer
3. Start Docker Desktop

### Step 2: Run Redis Container
```powershell
# Pull and run Redis
docker run -d --name redis -p 6379:6379 redis:alpine

# Verify it's running
docker ps
```

### Step 3: Configure `.env`
```env
# Redis Configuration (Docker)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### Auto-start on Windows Boot
```powershell
# Set container to restart automatically
docker update --restart unless-stopped redis
```

---

## Verify Redis is Working

### Method 1: Backend Logs
```bash
# Start your backend
npm run dev

# Look for these messages:
✅ Connected to Redis for HLS queue
✅ HLS Worker connected to Redis
✅ Connected to Redis for video processing
```

### Method 2: Redis CLI
```bash
# If using Memurai
memurai-cli ping

# If using WSL/Docker
redis-cli ping

# Should return: PONG
```

### Method 3: Check Keys
```bash
# Connect to Redis
redis-cli

# List all keys
KEYS *

# Should show bull queue keys like:
# bull:hls-processing:*
# bull:hls-processing:id
# bull:hls-processing:events
```

---

## Troubleshooting

### Redis Connection Error
```
❌ Redis connection error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solutions:**
1. Check if Redis is running:
   ```powershell
   # Memurai
   Get-Service Memurai
   
   # Docker
   docker ps
   
   # WSL
   wsl -d Ubuntu sudo service redis-server status
   ```

2. Start Redis:
   ```powershell
   # Memurai
   Start-Service Memurai
   
   # Docker
   docker start redis
   
   # WSL
   wsl -d Ubuntu sudo service redis-server start
   ```

3. Check firewall (if Redis is on different machine)

### Port Already in Use
```
❌ Error: Address already in use
```

**Solution:**
```powershell
# Find what's using port 6379
netstat -ano | findstr :6379

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Can't Connect from Backend
```
❌ Redis connection timeout
```

**Solution:**
1. Check `.env` REDIS_HOST and REDIS_PORT
2. Make sure no typos
3. Try `127.0.0.1` instead of `localhost`
4. Restart backend after `.env` changes

---

## Current Configuration

Your `.env` already has Redis configured:
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

**Next Steps:**
1. Install Redis (Memurai recommended)
2. Start Redis service
3. Restart your backend: `npm run dev`
4. Upload a video to test HLS processing

---

## Performance Tips

### Increase Memory Limit (Optional)
```bash
# Edit redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### Monitor Redis
```bash
# Real-time monitoring
redis-cli monitor

# Get stats
redis-cli info

# Check memory usage
redis-cli info memory
```

---

## HLS Worker Setup (Localhost)

Once Redis is running, you need to start the HLS worker:

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start HLS worker
node backend/hlsWorker.js
```

Or use PM2:
```bash
# Start both
pm2 start backend/server.js --name backend
pm2 start backend/hlsWorker.js --name hls-worker

# View logs
pm2 logs

# Check status
pm2 status
```

---

## Quick Setup (Recommended)

1. **Download Memurai:**
   ```
   https://www.memurai.com/get-memurai
   ```

2. **Install & Start:**
   ```powershell
   # After installation
   Start-Service Memurai
   ```

3. **Start Backend:**
   ```bash
   npm run dev
   ```

4. **Start HLS Worker:**
   ```bash
   node backend/hlsWorker.js
   ```

5. **Upload Video:**
   - Go to `/upload`
   - Upload a video
   - Check console for processing logs

---

**Last Updated:** December 26, 2025
**Status:** ⚠️ Needs Redis installation
