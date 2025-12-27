# Maintenance & Utility Scripts Guide 🛠️

## Overview

This guide covers all maintenance scripts and utilities for keeping your Movia platform running smoothly.

---

## 📧 Email Service Scripts

### Test Email Service
Test if your SMTP configuration is working:

```bash
# Test with your email
node test-email.js your-email@example.com

# Test with configured MAIL_USERNAME
node test-email.js
```

**What it does:**
- Validates SMTP credentials
- Sends test verification email
- Reports success or error

**Expected Output:**
```
✅ EMAIL SENT SUCCESSFULLY!
Check your inbox (and spam folder) for the verification email.
```

### Send Verification Emails to All Users
Send email verification links to all registered users:

```bash
node send-verification-emails.js
```

**What it does:**
- Connects to MongoDB
- Finds all unverified users
- Sends verification emails
- Shows detailed progress
- Provides summary report

**Expected Output:**
```
📊 SUMMARY:
   Total users:          25
   ✅ Sent successfully:  20
   ⏭️  Already verified:   3
   ❌ Failed:             2
```

**Before running:**
1. Make sure SMTP is configured in `.env`
2. Run `node test-email.js` first to verify setup
3. Be aware of email service daily limits (Brevo: 300 emails/day)

---

## 🎬 Video Management Scripts

### Fix Orphaned Videos
Fixes videos that were processed but database wasn't updated:

```bash
node fix-orphaned-videos.js
```

**What it does:**
- Finds videos stuck in "processing" or "queued" status
- Checks if HLS files exist locally
- Updates database to "completed" if files are found
- Marks as "failed" if processing timeout (>2 hours)

**When to use:**
- After server crashes during video processing
- If videos show "processing" but are actually done
- Database and files are out of sync

**Expected Output:**
```
📊 SUMMARY:
   Total checked: 5
   ✅ Fixed: 3
   ❌ Not found: 2
```

### Clean Up Temporary Files
Removes old temporary files to free disk space:

```bash
node cleanup-temp-files.js
```

**What it does:**
- Scans `tmp/` directory
- Deletes files older than 7 days
- Removes empty directories
- Reports space freed

**When to use:**
- Weekly maintenance
- When running low on disk space
- After bulk video uploads

**Expected Output:**
```
📊 CLEANUP SUMMARY:
   Files deleted: 45
   Directories deleted: 12
   Space freed: 1,234.56 MB
```

---

## 🔍 Diagnostic Scripts

### Check Video
Verify a specific video's status and files:

```bash
node check-video.js <video-id>
```

**What it does:**
- Shows video database record
- Checks if HLS files exist
- Verifies B2 storage
- Shows processing status

### Check Bucket
Lists all files in B2 bucket:

```bash
node check-bucket.js
```

**What it does:**
- Connects to B2 storage
- Lists all video files
- Shows file sizes
- Reports total storage used

---

## 🔧 Database Scripts

### Delete Broken Video
Removes a video and all its files:

```bash
node delete-broken-video.js <video-id>
```

**What it does:**
- Deletes video from database
- Removes HLS files from B2
- Cleans up temporary files
- Updates user's video list

**Warning:** This is permanent! Backup first if unsure.

### Resume Encoding
Retry encoding for failed videos:

```bash
node resume-encoding.js
```

**What it does:**
- Finds videos with status "failed"
- Re-queues them for processing
- Monitors progress

---

## 🚀 Service Management Scripts

### Windows

#### Start All Services
```bash
START-ALL.bat
```

Starts:
- MongoDB (if not using Atlas)
- Redis server
- Backend server
- HLS worker
- Frontend client

#### Stop All Services
```bash
STOP-ALL.bat
```

Safely stops all services.

#### Check Services
```powershell
.\check-services.ps1
```

Shows status of all services:
- Redis connection
- MongoDB connection
- Port availability
- Worker status

### Ubuntu/Linux

#### Start Services
```bash
# Using systemd
sudo systemctl start movia-backend movia-hls-worker

# Or development mode
npm run dev
```

#### Stop Services
```bash
sudo systemctl stop movia-backend movia-hls-worker
```

#### Check Status
```bash
sudo systemctl status movia-backend
sudo systemctl status movia-hls-worker
```

---

## 📊 Monitoring Scripts

### Service Check
```powershell
# Windows
.\check-services.ps1

# Linux
sudo systemctl status --all | grep movia
```

### Redis Queue Status
```bash
# Connect to Redis CLI
redis-cli

# Check queue length
LLEN hls_queue

# View queue jobs
LRANGE hls_queue 0 -1

# Clear queue (if needed)
DEL hls_queue
```

### MongoDB Status
```bash
# Connect to MongoDB
mongosh

# Use database
use movia

# Count videos
db.videos.countDocuments()

# Check processing status
db.videos.aggregate([
  { $group: { 
      _id: "$processingStatus", 
      count: { $sum: 1 } 
  }}
])

# Find failed videos
db.videos.find({ processingStatus: "failed" }).count()
```

---

## 🔄 Scheduled Maintenance

### Daily Tasks

```bash
# Morning - Check services
.\check-services.ps1  # Windows
sudo systemctl status movia-*  # Linux

# Check failed videos
mongosh --eval "db.videos.find({processingStatus:'failed'}).count()"
```

### Weekly Tasks

```bash
# Clean temporary files
node cleanup-temp-files.js

# Fix orphaned videos
node fix-orphaned-videos.js

# Check disk space
df -h  # Linux
Get-PSDrive  # Windows PowerShell
```

### Monthly Tasks

```bash
# Backup database
mongodump --out ~/backups/mongodb-$(date +%Y%m%d)

# Review failed videos and retry if needed
node resume-encoding.js

# Update system packages
sudo apt update && sudo apt upgrade  # Linux
```

---

## 🐛 Troubleshooting Scripts

### Port Already in Use
```powershell
# Windows - Kill process on port 5000
$port = 5000
Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

```bash
# Linux - Kill process on port 5000
sudo lsof -ti:5000 | xargs kill -9
```

### Clear Redis Queue
```bash
redis-cli
> FLUSHALL  # Clears ALL Redis data
> DEL hls_queue  # Clears only HLS queue
```

### Reset Failed Videos
```javascript
// In MongoDB shell
db.videos.updateMany(
  { processingStatus: "failed" },
  { $set: { processingStatus: "queued" } }
)
```

---

## 📝 Script Creation Guide

### Create Custom Maintenance Script

Template:
```javascript
/**
 * Custom Maintenance Script
 * Description: What this script does
 */

require('dotenv').config();
const mongoose = require('mongoose');

const mainFunction = async () => {
  try {
    console.log('\n🚀 Starting script...\n');

    // Connect to MongoDB if needed
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Your logic here
    
    console.log('\n✅ Script completed!\n');
    
    // Disconnect
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run script
mainFunction();
```

Save as `your-script.js` and run with:
```bash
node your-script.js
```

---

## 🔒 Security Best Practices

### Backup Before Running Scripts

Always backup before running destructive operations:

```bash
# Backup MongoDB
mongodump --out ~/backups/mongodb-$(date +%Y%m%d)

# Backup .env
cp .env .env.backup

# Backup video files (if needed)
tar -czf ~/backups/videos-$(date +%Y%m%d).tar.gz tmp/
```

### Test Scripts First

For scripts that modify data:
1. Run on a copy of your database first
2. Use a test environment
3. Review the code before executing
4. Keep backups

### Secure Script Execution

```bash
# Make scripts executable (Linux)
chmod +x script-name.js

# Set proper file permissions
chmod 600 .env  # Only owner can read/write
chmod 755 *.js  # Owner can execute, others can read
```

---

## 📞 Getting Help

If a script fails:

1. **Check Logs**:
   - Read the error message completely
   - Check backend logs: `backend/logs/`
   - Check system logs (Linux): `journalctl -u movia-*`

2. **Common Issues**:
   - MongoDB not running → `sudo systemctl start mongod`
   - Redis not running → `sudo systemctl start redis`
   - Missing .env variables → Check `.env` file
   - Permission denied → Run with `sudo` or fix file permissions

3. **Debug Mode**:
   ```bash
   # Run with more verbose output
   NODE_ENV=development node script-name.js
   ```

---

## 📚 Script Reference

| Script | Purpose | Frequency | Risk Level |
|--------|---------|-----------|------------|
| `test-email.js` | Test SMTP | As needed | ✅ Safe |
| `send-verification-emails.js` | Bulk emails | As needed | ⚠️ Medium |
| `fix-orphaned-videos.js` | Fix database | Weekly | ⚠️ Medium |
| `cleanup-temp-files.js` | Free space | Weekly | ✅ Safe |
| `check-video.js` | Diagnostic | As needed | ✅ Safe |
| `check-bucket.js` | View B2 files | As needed | ✅ Safe |
| `delete-broken-video.js` | Remove video | As needed | 🚨 High |
| `resume-encoding.js` | Retry failed | As needed | ⚠️ Medium |

**Risk Levels:**
- ✅ Safe: Read-only, no data modification
- ⚠️ Medium: Modifies data but reversible
- 🚨 High: Deletes data, not easily reversible

---

## 🎯 Quick Commands

```bash
# Health check everything
node check-services.js

# Weekly maintenance
node cleanup-temp-files.js && node fix-orphaned-videos.js

# Email all users
node send-verification-emails.js

# Test email service
node test-email.js your@email.com

# Check specific video
node check-video.js <video-id>

# Emergency stop
STOP-ALL.bat  # Windows
sudo systemctl stop movia-*  # Linux
```

---

**💡 Pro Tip:** Create a cron job (Linux) or Task Scheduler task (Windows) to run weekly maintenance automatically!

**Linux cron example:**
```bash
# Edit crontab
crontab -e

# Add weekly cleanup (every Sunday at 3 AM)
0 3 * * 0 cd /path/to/Movia && node cleanup-temp-files.js >> /var/log/movia-cleanup.log 2>&1
```

---

**✅ With these scripts, your Movia platform will stay healthy and performant!**
