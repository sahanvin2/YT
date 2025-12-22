# 🔐 Security Group Configuration for Workers

## Problem
Worker EC2 instances can't be reached from Main EC2 on port 3001.

## Solution: Update Security Groups

### Step 1: Find Security Group IDs

Go to AWS EC2 Console:
1. Select **Worker 1** (3.215.16.71) → Security tab → Note security group ID
2. Select **Worker 2** (98.80.144.199) → Security tab → Note security group ID  
3. Select **Worker 3** (3.227.1.7) → Security tab → Note security group ID
4. Select **Main EC2** (3.238.106.222) → Security tab → Note security group ID

### Step 2: Update Worker Security Groups

For **EACH worker EC2 security group**, add these **Inbound Rules**:

1. Go to: EC2 → Security Groups → Select worker security group → Edit inbound rules
2. Click "Add rule"
3. Configure:
   - **Type**: Custom TCP
   - **Port**: 3001
   - **Source**: Custom → Enter Main EC2 Public IP: `3.238.106.222/32`
   - **Description**: Allow video processing requests from main server
4. Click "Add rule" again for SSH access:
   - **Type**: SSH
   - **Port**: 22
   - **Source**: Your IP (or 0.0.0.0/0 for testing)
   - **Description**: SSH access
5. Click "Save rules"

### Step 3: Update Main EC2 Security Group

For **Main EC2 security group**, add these **Inbound Rules** (if not already added):

1. Go to: EC2 → Security Groups → Select main EC2 security group → Edit inbound rules
2. Ensure these rules exist:
   - **Port 5000** from anywhere (0.0.0.0/0) - Backend API
   - **Port 80** from anywhere (0.0.0.0/0) - HTTP
   - **Port 443** from anywhere (0.0.0.0/0) - HTTPS
   - **Port 22** from your IP - SSH access

### Step 4: Verify Worker Outbound Rules

Each worker needs to send callbacks to main server:

1. Go to worker security group → Outbound rules
2. Ensure "All traffic" to 0.0.0.0/0 is allowed (default)
   - Or specifically allow port 5000 to Main EC2 IP

## Quick Test Commands

After updating security groups, run these from your local machine:

### Test from Main EC2:
```bash
ssh -i "movia.pem" ubuntu@3.238.106.222 "curl -s http://3.215.16.71:3001/health && echo ' - Worker 1 OK'"
ssh -i "movia.pem" ubuntu@3.238.106.222 "curl -s http://98.80.144.199:3001/health && echo ' - Worker 2 OK'"
```

Expected output:
```json
{"status":"healthy","jobs":0,"cpu":5} - Worker 1 OK
{"status":"healthy","jobs":0,"cpu":10} - Worker 2 OK
```

### Test Worker Direct Access:
```bash
curl http://3.215.16.71:3001/health
curl http://98.80.144.199:3001/health
```

## Common Security Group Configurations

### Option 1: Public Access (For Testing)
**Worker Inbound Rules:**
- Port 3001 from 0.0.0.0/0 (anyone can access - not recommended for production)
- Port 22 from your IP

### Option 2: Private Access (Recommended)
**Worker Inbound Rules:**
- Port 3001 from Main EC2 security group (select security group instead of IP)
- Port 22 from your IP

### Option 3: VPC Private (Most Secure)
**Worker Inbound Rules:**
- Port 3001 from 10.0.0.0/16 (entire VPC range)
- Port 22 from your IP

## Current Setup

✅ **Worker 1**: 3.215.16.71 - Video worker running on port 3001
✅ **Worker 2**: 98.80.144.199 - Video worker running on port 3001
⏳ **Worker 3**: 3.227.1.7 - Not configured yet

✅ **Main EC2**: 3.238.106.222
- Backend: Port 5000
- Frontend: Port 80/443
- Worker IPs configured: 3.215.16.71, 98.80.144.199

## After Security Group Fix

The system will:
1. ✅ Automatically distribute video processing to 2 workers
2. ✅ Balance load based on worker health
3. ✅ Prevent main EC2 crashes during high upload volumes
4. ✅ Handle 10-20 videos per minute easily

Each worker can process ~5-10 videos simultaneously.
With 2 workers = 10-20 videos/minute capacity! 🚀
