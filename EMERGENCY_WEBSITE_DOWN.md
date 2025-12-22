# 🚨 EMERGENCY: Website Down - xclub.asia

## Error: ERR_TIMED_OUT

### Cause: Main EC2 Instance is NOT RESPONDING

## IMMEDIATE ACTIONS REQUIRED:

### Step 1: Check EC2 Instance Status in AWS Console

1. **Go to AWS Console:** https://console.aws.amazon.com/ec2/
2. **Region:** US East (N. Virginia) us-east-1
3. **Find instance:** `i-0721468aa96aa327c` (ec2-3-238-106-222)

**Check the Instance State:**
- ❌ **If STOPPED** → Start the instance
- ❌ **If STOPPING** → Wait, then start
- ⚠️ **If RUNNING but Status Check Failed** → Reboot instance
- ✅ **If RUNNING with 2/2 checks passed** → Continue to Step 2

### Step 2: Start/Reboot Instance

**To START (if stopped):**
1. Select the instance
2. Instance state → Start instance
3. Wait 2-3 minutes

**To REBOOT (if running but not responding):**
1. Select the instance
2. Instance state → Reboot instance
3. Wait 2-3 minutes

### Step 3: After Instance is Running

Run this PowerShell script:

```powershell
# Wait for instance to be ready
Write-Host "Waiting for EC2 to come online..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Test connection
for ($i = 1; $i -le 20; $i++) {
    Write-Host "Connection attempt $i..."
    $test = ssh -o ConnectTimeout=5 -i "C:\Users\User\Downloads\movia.pem" ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com "echo OK" 2>&1
    if ($test -like "*OK*") {
        Write-Host "Connected!" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 10
}

# Check and restart services
Write-Host "`nChecking services..." -ForegroundColor Cyan
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com @"
echo 'Checking Nginx...'
sudo systemctl status nginx --no-pager | head -5
if ! systemctl is-active --quiet nginx; then
    echo 'Starting Nginx...'
    sudo systemctl start nginx
fi

echo ''
echo 'Checking PM2...'
pm2 list

echo ''
echo 'Checking backend...'
pm2 describe movia-backend | grep status

# Restart if needed
if ! pm2 describe movia-backend | grep -q 'status.*online'; then
    echo 'Restarting backend...'
    cd /home/ubuntu/YT/backend
    pm2 restart all
fi

echo ''
echo 'Services restarted'
pm2 list
"@

# Test website
Write-Host "`nTesting website..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
$response = Invoke-WebRequest -Uri "https://xclub.asia" -TimeoutSec 10 -UseBasicParsing -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    Write-Host "✅ Website is BACK ONLINE!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Website may still be loading..." -ForegroundColor Yellow
}
```

### Step 4: If Still Not Working

**Check Security Groups:**
1. In EC2 Console, select the instance
2. Security tab → Security groups
3. Check Inbound rules have:
   - Port 80 (HTTP) - 0.0.0.0/0
   - Port 443 (HTTPS) - 0.0.0.0/0
   - Port 22 (SSH) - Your IP or 0.0.0.0/0

**Check Elastic IP:**
1. EC2 Console → Elastic IPs
2. Verify the Elastic IP is associated with the instance

### Step 5: Manual Service Restart (if script fails)

```bash
# SSH manually
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com

# Check and start Nginx
sudo systemctl start nginx
sudo systemctl status nginx

# Check and restart backend
cd /home/ubuntu/YT/backend
pm2 restart all
pm2 logs --lines 20

# Check if it's listening
sudo netstat -tlnp | grep -E ':(80|443|5000)'
```

### Step 6: Verify

```bash
# Check website
curl -I https://xclub.asia

# Should return: HTTP/2 200
```

## Common Issues:

### Issue 1: Instance Stopped Due to Cost Savings
- **Solution:** Start the instance from AWS Console

### Issue 2: Out of Memory (OOM)
- **Solution:** Reboot instance, then run recovery script

### Issue 3: Disk Full
```bash
df -h
# If > 90% full, clean up:
sudo apt clean
pm2 flush
```

### Issue 4: SSL Certificate Expired
```bash
sudo certbot renew
sudo systemctl reload nginx
```

## Prevention:

1. **Set up CloudWatch Alarms** for instance health
2. **Enable Auto Recovery** in EC2 settings
3. **Use Elastic IP** to maintain same IP
4. **Regular backups** with AMI snapshots

## Quick Status Check:

```powershell
# Run this to check status without SSH:
aws ec2 describe-instance-status --instance-ids i-0721468aa96aa327c
```

---

**URGENT: The instance is likely STOPPED or CRASHED. You MUST access AWS Console NOW!**
