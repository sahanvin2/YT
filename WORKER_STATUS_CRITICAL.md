# 🚨 CRITICAL: Worker Communication Issue - URGENT FIX NEEDED

**Date:** December 21, 2025  
**Issue:** Workers cannot be reached from Main EC2 - AWS Security Groups blocking port 3001  
**Impact:** All video processing is failing or only using first worker

---

## ⚠️ Current Status

### Workers Running Status ✅
- **Worker 1** (3.215.16.71): ✅ ONLINE - Port 3001 listening, 0 jobs, CPU 1%
- **Worker 2** (98.80.144.199): ✅ ONLINE - Port 3001 listening, 0 jobs, CPU ~1%
- **Main EC2** (3.238.106.222): ✅ ONLINE - Backend configured with workers

### Critical Problem ❌
**Main EC2 CANNOT reach workers on port 3001**
- Curl from main to Worker 1: ❌ Connection timeout
- Curl from main to Worker 2: ❌ Connection timeout
- Workers responding locally: ✅ Working (localhost:3001/health)

### Root Cause
**AWS Security Groups are blocking inbound traffic on port 3001 to workers**

---

## 🔥 IMMEDIATE FIX REQUIRED

### Option 1: Fix AWS Security Groups (RECOMMENDED) ⭐

#### Step 1: Update Worker 1 Security Group
```bash
# Go to AWS Console: EC2 → Security Groups
# Find Worker 1 (3.215.16.71) security group

# ADD Inbound Rule:
Type: Custom TCP
Port: 3001
Source: 3.238.106.222/32 (Main EC2 IP)
Description: Allow main EC2 to send transcode jobs
```

#### Step 2: Update Worker 2 Security Group
```bash
# Go to AWS Console: EC2 → Security Groups
# Find Worker 2 (98.80.144.199) security group

# ADD Inbound Rule:
Type: Custom TCP
Port: 3001
Source: 3.238.106.222/32 (Main EC2 IP)
Description: Allow main EC2 to send transcode jobs
```

#### Step 3: Test Connection
```bash
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@3.238.106.222

# Test Worker 1
curl -s http://3.215.16.71:3001/health
# Should return: {"status":"healthy","jobs":0,...}

# Test Worker 2
curl -s http://98.80.144.199:3001/health
# Should return: {"status":"healthy","jobs":0,...}
```

#### Step 4: Verify Load Balancing
```bash
# Upload a video and check logs
pm2 logs backend --lines 20 | grep "Selected worker"
# Should show different workers being selected
```

---

### Option 2: Alternative - Use AWS VPC Peering/Security Group References

If workers are in the same VPC:
```bash
# Instead of IP address (3.238.106.222/32)
# Use Security Group ID reference (sg-xxxxxxxxx)
# This allows all instances in that security group to connect
```

---

## 📊 Environment Configuration Status

### Main EC2 Configuration ✅
```env
WORKER_IPS=3.215.16.71,98.80.144.199
WORKERS_ENABLED=true
CALLBACK_URL=http://3.238.106.222:5000
```

### Backend Status
- Process: ONLINE (PM2 - 66 restarts, currently running)
- Worker queue: Configured and attempting to use workers
- MongoDB: Connected
- Recent activity: Videos being added to queue

---

## 🎯 What Happens After Fix

Once security groups are updated:

1. **Main EC2** will be able to:
   - Check worker health (GET /health)
   - Send transcode jobs (POST /api/transcode)
   - Get job status updates

2. **Workers** will:
   - Receive jobs from main EC2
   - Process videos with FFmpeg
   - Send completion callbacks to main EC2

3. **Load Balancing** will work:
   - videoQueue checks all workers
   - Selects least busy worker
   - Distributes load evenly
   - Prevents single-worker overload

---

## 🔍 How to Verify It's Working

### Test 1: Health Checks
```bash
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@3.238.106.222
curl http://3.215.16.71:3001/health
curl http://98.80.144.199:3001/health
# Both should return JSON with status: healthy
```

### Test 2: Upload Video
1. Go to xclub.asia/upload
2. Upload a video
3. Check backend logs:
```bash
pm2 logs backend --lines 50 | grep worker
# Should see: "Selected worker: 3.215.16.71" or "Selected worker: 98.80.144.199"
```

### Test 3: Worker Logs
```bash
# Worker 1
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@3.215.16.71
pm2 logs video-worker
# Should see: "Received transcode request for video..."

# Worker 2
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@98.80.144.199
pm2 logs video-worker
# Should see job activity when used
```

---

## 📈 Expected Behavior After Fix

### Normal Operation:
```
User uploads video
  ↓
Main EC2 receives upload
  ↓
videoQueue.getBestWorker()
  ├→ Checks Worker 1: 2 jobs, CPU 45%
  ├→ Checks Worker 2: 0 jobs, CPU 12%
  └→ Selects Worker 2 (least busy)
  ↓
POST to Worker 2: http://98.80.144.199:3001/api/transcode
  ↓
Worker 2 processes with FFmpeg
  ↓
Worker 2 sends callback: http://3.238.106.222:5000/api/transcode/callback
  ↓
Main EC2 updates video status to "completed"
```

### Under Heavy Load (10-20 videos):
```
Worker 1: Processing 3 videos (CPU 60%)
Worker 2: Processing 3 videos (CPU 55%)
New video arrives
  ↓
videoQueue checks both workers
  ↓
Selects worker with fewer jobs
  ↓
Distributes load evenly
```

---

## ⚡ Quick Fix Command (AWS CLI)

If you have AWS CLI configured:

```bash
# Get Worker 1 Security Group ID
aws ec2 describe-instances --instance-ids i-WORKER1-ID --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId'

# Add rule to Worker 1
aws ec2 authorize-security-group-ingress \
  --group-id sg-WORKER1-SG-ID \
  --protocol tcp \
  --port 3001 \
  --cidr 3.238.106.222/32

# Repeat for Worker 2
aws ec2 authorize-security-group-ingress \
  --group-id sg-WORKER2-SG-ID \
  --protocol tcp \
  --port 3001 \
  --cidr 3.238.106.222/32
```

---

## 🚨 UNTIL FIX IS APPLIED

**Current Risk:**
- All videos are queued but may not process
- Main EC2 will try to use workers but connection times out
- Videos will stay in "pending" or "queued" status
- System may crash if too many uploads happen

**Temporary Workaround:**
Workers can still receive callbacks because:
- They initiate outbound connections to Main EC2
- Security groups allow outbound by default
- But Main EC2 cannot send jobs to workers

**Action Required:** 
🔴 **Update AWS Security Groups IMMEDIATELY to allow port 3001 from Main EC2**

---

## 📞 Need Help?

If you cannot access AWS Console:
1. Contact AWS admin
2. Request: "Add inbound rule for port 3001 from 3.238.106.222/32 to worker security groups"
3. Provide: Worker IPs (3.215.16.71, 98.80.144.199)

After fix is applied:
```bash
# Restart backend to reinitialize worker connections
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@3.238.106.222
pm2 restart backend
```
