# Complete Ubuntu Setup Guide for Movia Video Platform 🎬🐧

## Prerequisites

This guide is for Ubuntu users (20.04 or later) with NVIDIA GPU (RTX series recommended).

### What You'll Need:
- Ubuntu 20.04 LTS or later
- NVIDIA GPU (RTX 2050, RTX 3060, RTX 4060, etc.)
- 16GB+ RAM recommended
- 50GB+ free disk space
- Stable internet connection

---

## Part 1: System Setup & GPU Configuration

### Step 1: Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install NVIDIA Drivers

Check if you have NVIDIA GPU:
```bash
lspci | grep -i nvidia
```

Install NVIDIA drivers:
```bash
# Add graphics drivers PPA
sudo add-apt-repository ppa:graphics-drivers/ppa
sudo apt update

# Install recommended driver (usually latest)
sudo ubuntu-drivers autoinstall

# OR manually install specific version
sudo apt install nvidia-driver-535  # Adjust version as needed

# Reboot
sudo reboot
```

After reboot, verify installation:
```bash
nvidia-smi
```

You should see your GPU details (RTX 2050, RTX 3060, etc.)

### Step 3: Install CUDA Toolkit

```bash
# Download CUDA 12.x (check latest on NVIDIA website)
wget https://developer.download.nvidia.com/compute/cuda/12.3.0/local_installers/cuda_12.3.0_545.23.06_linux.run

sudo sh cuda_12.3.0_545.23.06_linux.run

# Follow prompts - accept license, install toolkit
# SKIP driver installation if you already installed drivers
```

Add CUDA to PATH:
```bash
echo 'export PATH=/usr/local/cuda/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc
```

Verify CUDA:
```bash
nvcc --version
```

---

## Part 2: Install Required Software

### Step 4: Install Node.js & npm

```bash
# Install Node.js 20.x (LTS recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 5: Install FFmpeg with NVIDIA Support

This is CRUCIAL for GPU-accelerated video encoding:

```bash
# Install dependencies
sudo apt install -y build-essential yasm cmake libtool libc6 \
  libc6-dev unzip wget libnuma1 libnuma-dev pkg-config

# Install FFmpeg with NVENC support
sudo apt install -y ffmpeg

# Verify FFmpeg has NVIDIA support
ffmpeg -encoders | grep nvenc
```

You should see encoders like:
- `h264_nvenc` - H.264 NVIDIA encoder
- `hevc_nvenc` - H.265 NVIDIA encoder

If not found, you may need to compile FFmpeg from source with NVIDIA support:

```bash
# Build FFmpeg with NVENC (if apt version doesn't have it)
git clone https://git.ffmpeg.org/ffmpeg.git ffmpeg
cd ffmpeg
./configure --enable-cuda-nvcc --enable-cuvid --enable-nvenc \
  --enable-nonfree --enable-libnpp \
  --extra-cflags=-I/usr/local/cuda/include \
  --extra-ldflags=-L/usr/local/cuda/lib64
make -j$(nproc)
sudo make install
```

### Step 6: Install MongoDB

```bash
# Import MongoDB public GPG key
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

**OR use MongoDB Atlas (Cloud - Recommended):**
- Go to https://www.mongodb.com/cloud/atlas
- Create free cluster
- Get connection string
- Use in `.env` file

### Step 7: Install Redis

Redis is required for HLS video processing queue:

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Find "supervised no" and change to "supervised systemd"
# Save and exit (Ctrl+X, Y, Enter)

# Restart Redis
sudo systemctl restart redis
sudo systemctl enable redis

# Verify Redis is running
redis-cli ping
# Should respond with: PONG
```

---

## Part 3: Project Setup

### Step 8: Clone and Install Project

```bash
# Create project directory
mkdir -p ~/projects
cd ~/projects

# Clone or download your project
# If you have the code:
cd ~/projects/Movia

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 9: Configure Environment Variables

Create `.env` file in project root:

```bash
nano .env
```

Add the following configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/movia
# OR if using MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/movia?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=30d

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Backblaze B2 Storage Configuration
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_ACCESS_KEY_ID=your_b2_access_key_here
B2_SECRET_ACCESS_KEY=your_b2_secret_key_here
B2_BUCKET=your-bucket-name
B2_PUBLIC_BASE=https://f005.backblazeb2.com/file/your-bucket-name

# CDN Configuration (optional)
CDN_BASE=https://your-cdn-url.b-cdn.net

# Email Configuration (Brevo SMTP - Free)
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-brevo-smtp-key
MAIL_FROM_NAME=Movia
MAIL_FROM_ADDRESS=noreply@movia.com

# Worker Configuration
WORKERS_ENABLED=true
MAX_VIDEO_SIZE_MB=5120
```

Save and exit (Ctrl+X, Y, Enter)

### Step 10: Setup Backblaze B2 Storage

1. Go to https://www.backblaze.com/b2/cloud-storage.html
2. Create free account (10GB free)
3. Create a bucket:
   - Name it (e.g., `movia-videos`)
   - Set to "Public" for video streaming
4. Generate Application Key:
   - Go to "App Keys"
   - Click "Add a New Application Key"
   - Give all permissions or specific bucket permissions
   - Copy the `keyID` (B2_ACCESS_KEY_ID) and `applicationKey` (B2_SECRET_ACCESS_KEY)
5. Update `.env` with your B2 credentials

### Step 11: Setup Email Service (Optional)

See `SMTP_SETUP_GUIDE.md` for detailed instructions.

Quick setup with Brevo (free 300 emails/day):
1. Sign up at https://www.brevo.com/
2. Get SMTP credentials
3. Update `.env` MAIL_* variables

---

## Part 4: Running the Application

### Step 12: Create Systemd Services (Production)

For running services automatically:

#### Backend Service

```bash
sudo nano /etc/systemd/system/movia-backend.service
```

Add:

```ini
[Unit]
Description=Movia Backend Server
After=network.target mongod.service redis-server.service

[Service]
Type=simple
User=yourusername
WorkingDirectory=/home/yourusername/projects/Movia
ExecStart=/usr/bin/node backend/server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Replace `yourusername` with your actual Ubuntu username.

#### HLS Worker Service

```bash
sudo nano /etc/systemd/system/movia-hls-worker.service
```

Add:

```ini
[Unit]
Description=Movia HLS Video Processing Worker
After=network.target mongod.service redis-server.service

[Service]
Type=simple
User=yourusername
WorkingDirectory=/home/yourusername/projects/Movia
ExecStart=/usr/bin/node backend/hlsWorker.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

#### Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services (start on boot)
sudo systemctl enable movia-backend
sudo systemctl enable movia-hls-worker

# Start services
sudo systemctl start movia-backend
sudo systemctl start movia-hls-worker

# Check status
sudo systemctl status movia-backend
sudo systemctl status movia-hls-worker
```

### Step 13: Development Mode

For development with hot-reload:

```bash
# Terminal 1 - Backend with nodemon
npm run dev

# Terminal 2 - HLS Worker
npm run worker

# Terminal 3 - Frontend
npm run client
```

Or all together:
```bash
npm run start:all
```

---

## Part 5: Testing & Verification

### Step 14: Test GPU Encoding

```bash
# Check if NVENC is available
ffmpeg -hide_banner -encoders | grep nvenc

# Test encode a sample video
ffmpeg -i input.mp4 -c:v h264_nvenc -preset fast output.mp4

# Monitor GPU usage during encoding
watch -n 1 nvidia-smi
```

### Step 15: Test Redis Connection

```bash
redis-cli
> PING
PONG
> SET test "Hello Redis"
OK
> GET test
"Hello Redis"
> exit
```

### Step 16: Test MongoDB Connection

```bash
mongosh  # or mongo on older versions
> show dbs
> use movia
> db.users.countDocuments()
> exit
```

### Step 17: Test Application

Open browser and navigate to:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/health

Upload a test video and watch HLS processing in action!

---

## Part 6: Monitoring & Logs

### View Service Logs

```bash
# Backend logs
sudo journalctl -u movia-backend -f

# HLS Worker logs
sudo journalctl -u movia-hls-worker -f

# MongoDB logs
sudo journalctl -u mongod -f

# Redis logs
sudo journalctl -u redis-server -f
```

### Monitor GPU Usage

```bash
# Real-time GPU monitoring
watch -n 1 nvidia-smi

# Or install and use nvtop (better visualization)
sudo apt install nvtop
nvtop
```

### Monitor System Resources

```bash
# Install htop for better system monitoring
sudo apt install htop
htop
```

---

## Part 7: Troubleshooting

### GPU Not Detected by FFmpeg

```bash
# Check NVIDIA driver
nvidia-smi

# Check CUDA
nvcc --version

# Rebuild FFmpeg with NVENC support (see Step 5)
```

### Port Already in Use

```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>

# Or change port in .env
PORT=5001
```

### MongoDB Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongod

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod
```

### Redis Connection Issues

```bash
# Check Redis status
sudo systemctl status redis

# Test connection
redis-cli ping

# Restart Redis
sudo systemctl restart redis
```

### Video Upload Fails

- Check disk space: `df -h`
- Check B2 credentials in `.env`
- Check upload folder permissions: `ls -la tmp/`
- Create tmp folder if missing: `mkdir -p tmp`

### HLS Processing Fails

```bash
# Check HLS worker is running
sudo systemctl status movia-hls-worker

# Check Redis queue
redis-cli
> KEYS *
> LLEN hls_queue

# View worker logs
sudo journalctl -u movia-hls-worker -n 100
```

---

## Part 8: Performance Optimization

### For Best GPU Performance:

1. **Use latest NVIDIA drivers**
2. **Enable CUDA MPS** (Multi-Process Service):
```bash
sudo nvidia-cuda-mps-control -d
```

3. **Optimize FFmpeg settings** in `backend/hlsWorker.js`:
   - Lower preset for faster encoding: `-preset fast`
   - Adjust GOP size: `-g 48`
   - Use 2-pass encoding for better quality

4. **Increase Redis memory**:
```bash
sudo nano /etc/redis/redis.conf
# Set: maxmemory 512mb
# Set: maxmemory-policy allkeys-lru
sudo systemctl restart redis
```

5. **MongoDB optimization**:
```bash
# Enable journaling
# Add indexes for frequently queried fields
```

---

## Part 9: Backup & Maintenance

### Backup MongoDB

```bash
# Backup all databases
mongodump --out ~/backups/mongodb-$(date +%Y%m%d)

# Backup specific database
mongodump --db movia --out ~/backups/movia-$(date +%Y%m%d)

# Restore backup
mongorestore ~/backups/mongodb-20231225/
```

### Backup Configuration

```bash
# Backup .env and important configs
cp .env .env.backup-$(date +%Y%m%d)
tar -czf ~/backups/movia-config-$(date +%Y%m%d).tar.gz \
  .env package.json backend/config/
```

### Clean Up Old HLS Files

```bash
# Remove temp files older than 7 days
find tmp/ -type f -mtime +7 -delete

# Clean Redis old jobs
redis-cli
> DEL old_job_key
```

---

## Part 10: Security Best Practices

1. **Firewall Setup**:
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

2. **MongoDB Security**:
```bash
# Enable authentication
sudo nano /etc/mongod.conf
# Add:
# security:
#   authorization: enabled

# Create admin user
mongosh
> use admin
> db.createUser({user:"admin", pwd:"strongpassword", roles:["root"]})
```

3. **Update .env permissions**:
```bash
chmod 600 .env
```

4. **Regular Updates**:
```bash
sudo apt update && sudo apt upgrade -y
```

---

## Quick Reference Commands

```bash
# Start all services
sudo systemctl start movia-backend movia-hls-worker mongod redis

# Stop all services
sudo systemctl stop movia-backend movia-hls-worker

# Restart services
sudo systemctl restart movia-backend movia-hls-worker

# View logs
sudo journalctl -u movia-backend -f
sudo journalctl -u movia-hls-worker -f

# Check GPU
nvidia-smi

# Check Redis
redis-cli ping

# Check MongoDB
mongosh --eval "db.adminCommand('ping')"

# Monitor system
htop
```

---

## Support & Resources

- **NVIDIA CUDA Documentation**: https://docs.nvidia.com/cuda/
- **FFmpeg NVENC Guide**: https://docs.nvidia.com/video-technologies/video-codec-sdk/
- **MongoDB Docs**: https://docs.mongodb.com/
- **Redis Documentation**: https://redis.io/documentation
- **Backblaze B2 Docs**: https://www.backblaze.com/b2/docs/

---

## What's Next?

After successful setup:
1. ✅ Upload test video
2. ✅ Monitor HLS processing with `nvidia-smi`
3. ✅ Check video playback in browser
4. ✅ Configure domain and SSL (for production)
5. ✅ Set up automated backups
6. ✅ Configure email notifications
7. ✅ Add monitoring (Prometheus/Grafana)

---

**🎉 Congratulations! Your Movia platform is now running on Ubuntu with GPU acceleration! 🚀**

For issues or questions, check the troubleshooting section or review the logs.
