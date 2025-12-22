# 🔧 Complete Worker Security Group Fix

## Current Status

### Workers Found:
1. **Worker 1** (3.215.16.71): ✅ New setup, PM2 running, Port 3001 listening
2. **Worker 2** (98.80.144.199): ✅ New setup, PM2 running, Port 3001 listening  
3. **Worker 3** (3.227.1.7): ⚠️ OLD setup, Redis on 6379, using 1GB RAM

### Problem:
- **Main EC2 can reach Workers 1 & 2** ✅
- **But Worker 3 security group might have the CORRECT rules that Workers 1 & 2 need to copy**
- Worker 3 is in CloudWatch but using old system (Redis-based)

---

## 🎯 Fix: Copy Worker 3 Security Group to Workers 1 & 2

### Step 1: Find Worker 3 Security Group

1. Go to **AWS Console** → **EC2** → **Instances**
2. Find instance **i-0721468aa96aa327c** (3.227.1.7) - this is the one in your CloudWatch
3. Click on it → **Security** tab → Note the **Security Group ID**

### Step 2: Check Worker 3 Inbound Rules

Look for these rules in Worker 3 security group:
```
Port 3001, TCP, Source: 3.238.106.222/32 (Main EC2)
Port 22, TCP, Source: Your IP
Port 6379, TCP, Source: 3.238.106.222/32 (Redis - not needed for new workers)
```

### Step 3: Option A - Use Same Security Group (EASIEST)

1. Go to **Worker 1** (3.215.16.71) instance
2. Click **Actions** → **Security** → **Change Security Groups**
3. **Add** Worker 3's security group (keep existing ones)
4. Repeat for **Worker 2** (98.80.144.199)

### Step 4: Option B - Copy Rules Manually

**For Worker 1 Security Group:**
1. Find Worker 1 (3.215.16.71) → Security Group
2. Click **Edit inbound rules**
3. Add:
   - Type: `Custom TCP`
   - Port: `3001`
   - Source: `3.238.106.222/32`
   - Description: `Main EC2 job distribution`

**For Worker 2 Security Group:**
1. Find Worker 2 (98.80.144.199) → Security Group  
2. Click **Edit inbound rules**
3. Add:
   - Type: `Custom TCP`
   - Port: `3001`
   - Source: `3.238.106.222/32`
   - Description: `Main EC2 job distribution`

---

## 📊 After Fix - Test Commands

```powershell
# Test Worker 1 connectivity
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@3.238.106.222 "curl -s http://3.215.16.71:3001/health"
# Should return: {"status":"healthy","jobs":0,...}

# Test Worker 2 connectivity
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@3.238.106.222 "curl -s http://98.80.144.199:3001/health"
# Should return: {"status":"healthy","jobs":0,...}

# Check load distribution
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@3.238.106.222 "pm2 logs backend --lines 30 | grep 'Selected worker'"
# Should show: "Selected worker: 3.215.16.71" or "Selected worker: 98.80.144.199"
```

---

## 🔄 Migrate from Worker 3 (Old) to Workers 1 & 2 (New)

### Why Worker 3 is OLD:
- Uses Redis queue (port 6379)
- 1GB RAM usage (inefficient)
- Process name: `videoWorker` (not `video-worker`)
- Not in WORKER_IPS configuration

### Migration Steps:

1. **After Workers 1 & 2 are working:**
   ```bash
   # Stop Worker 3 to save costs
   ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@3.227.1.7 "pm2 stop videoWorker"
   ```

2. **Verify Workers 1 & 2 handle all jobs**
3. **Eventually terminate Worker 3 EC2** to reduce AWS costs

---

## 🎯 Expected Result

**After security group fix:**

```
User uploads video
  ↓
Main EC2 receives upload
  ↓
videoQueue checks Workers 1 & 2 (NOT Worker 3)
  ↓
Sends job to least busy worker
  ↓  
Worker 1 or 2 processes with FFmpeg
  ↓
Sends callback to Main EC2
  ↓
Video status updated to "completed"
```

**Load Distribution:**
- Video 1 → Worker 1 (3.215.16.71)
- Video 2 → Worker 2 (98.80.144.199)  
- Video 3 → Worker 1 (least busy)
- Video 4 → Worker 2 (least busy)

**Worker 3 (OLD) will not receive any jobs** because it's not in WORKER_IPS.

---

## 🚨 Quick Commands

### Check All Workers:
```bash
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@3.215.16.71 "curl http://localhost:3001/health"
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@98.80.144.199 "curl http://localhost:3001/health"
```

### Check Main EC2 Can Reach Workers:
```bash
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@3.238.106.222 "curl http://3.215.16.71:3001/health && curl http://98.80.144.199:3001/health"
```

### Upload Test Video:
1. Go to https://xclub.asia/upload
2. Upload a small video
3. Check backend logs:
```bash
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@3.238.106.222 "pm2 logs backend --lines 50 | grep 'Selected worker'"
```

Should see: `Selected worker: 3.215.16.71` or `Selected worker: 98.80.144.199`

---

## 📞 If Still Not Working

Check these:

1. **Security Groups:**
   - Worker 1 allows port 3001 from 3.238.106.222/32 ✓
   - Worker 2 allows port 3001 from 3.238.106.222/32 ✓

2. **Workers Running:**
   ```bash
   ssh -i movia.pem ubuntu@3.215.16.71 "pm2 status"
   ssh -i movia.pem ubuntu@98.80.144.199 "pm2 status"
   ```

3. **Configuration:**
   ```bash
   ssh -i movia.pem ubuntu@3.238.106.222 "cat /home/ubuntu/YT/.env | grep WORKER"
   ```
   Should show: `WORKER_IPS=3.215.16.71,98.80.144.199`

4. **Restart backend:**
   ```bash
   ssh -i movia.pem ubuntu@3.238.106.222 "pm2 restart backend"
   ```
