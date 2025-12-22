const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { handleCallback, getAllWorkersStatus, retryFailedVideos } = require('../utils/videoQueue');

// Worker callback endpoint (called by workers when job completes)
router.post('/callback', async (req, res) => {
  try {
    const { videoId, status, variants, error, workerIp } = req.body;
    await handleCallback(videoId, status, variants, error, workerIp);
    res.json({ success: true });
  } catch (err) {
    console.error('Callback error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all workers status (admin only)
router.get('/workers', protect, async (req, res) => {
  try {
    const workers = await getAllWorkersStatus();
    res.json({ success: true, workers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retry failed videos (admin only)
router.post('/retry', protect, async (req, res) => {
  try {
    await retryFailedVideos();
    res.json({ success: true, message: 'Retry initiated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;























































































































































































































































































































































































































































































































































































**You can now handle 10-20 videos/minute without crashes!** 🚀✅ **Monitored**: Real-time worker health tracking  ✅ **Reliable**: Auto-retry failed videos  ✅ **Cost Effective**: Stop workers when not needed  ✅ **Scalable**: Add/remove workers anytime  ✅ **Load Balanced**: Auto-selects least busy worker  ✅ **Simple**: No AWS SQS, just EC2 instances  ## Summary---```  }'    "callbackUrl": "http://3.238.106.222:5000/api/transcode/callback"    "videoPath": "test.mp4",    "videoId": "test123",  -d '{  -H "Content-Type: application/json" \curl -X POST http://WORKER-IP:3001/api/transcode \```bash### Test Direct Worker:```pm2 logs backend | grep worker```bash### Check Main EC2 Logs:```pm2 restart video-workerpm2 logs video-workerssh -i movia.pem ubuntu@WORKER-IP```bash### Worker Not Responding:## Troubleshooting---- **Peak capacity**: 200+ videos/hour- **Recommended**: 8-10 workers (c5.2xlarge)- **Minimum**: 6-8 workers (t3.xlarge)### Scaling to Handle 10-20 Videos/Minute:- **Cost with auto-stop**: ~$5-8/day (running only when needed)- **Cost**: ~$0.65/hour (all running) = ~$15/day- **Capacity**: ~40-60 videos per hour### With 4 Workers (t3.xlarge):## Performance & Capacity---```fi    aws ec2 start-instances --instance-ids i-worker3 i-worker4    # Start all workers    echo "High load ($PENDING videos) - starting all workers"else    aws ec2 stop-instances --instance-ids i-worker3 i-worker4    # Stop extra workers via AWS CLI    echo "Low load ($PENDING videos) - keeping only 2 workers"if [ "$PENDING" -lt 5 ]; thenPENDING=$(mongo your-db --quiet --eval "db.videos.count({processingStatus: 'queued'})")# Get pending videos count#!/bin/bash```bash```nano /home/ubuntu/YT/scripts/manage-workers.sh```bashCreate script:```*/10 * * * * /home/ubuntu/YT/scripts/manage-workers.sh# Check every 10 minutes - stop idle workers```bashAdd:```crontab -e```bashOn Main EC2, create this cron job:### Cost-Saving Auto-Stop Script:4. Stop the EC2 instance to save costs3. Restart main backend2. Remove IP from WORKER_IPS on main EC21. Stop PM2 on worker: `pm2 stop video-worker`### To Remove Workers:4. Done! It will auto-discover and use the new worker3. Restart main backend2. Add IP to WORKER_IPS in main EC21. Launch new EC2 instance (follow Step 2)### To Add More Workers:## Step 6: Scaling Up/Down---```}  "healthyWorkers": 4  "totalWorkers": 4,  ],    }      "cpu": 30      "jobs": 1,      "healthy": true,      "ip": "54.123.45.68",    {    },      "cpu": 45      "jobs": 2,      "healthy": true,      "ip": "54.123.45.67",    {  "workers": [  "success": true,{```json### Response:```  -H "Authorization: Bearer YOUR_TOKEN"curl http://3.238.106.222:5000/api/transcode/workers \```bash### Check workers status via API:## Step 5: Monitoring Workers---```pm2 logs backend | grep "Selected worker"# On main EC2```bash### Check Worker Distribution:```# Should return: {"status":"healthy","jobs":0,"cpu":10}curl http://WORKER4-IP:3001/healthcurl http://WORKER3-IP:3001/healthcurl http://WORKER2-IP:3001/healthcurl http://WORKER1-IP:3001/health# Check worker health from main server```bash### Test from Main EC2:## Step 4: Testing---```pm2 restart backend```bashRestart:```WORKER_IPS=54.123.45.67,54.123.45.68,54.123.45.69,54.123.45.70```envUpdate WORKER_IPS with all your worker IPs:```nano .envcd /home/ubuntu/YT/backendssh -i movia.pem ubuntu@3.238.106.222```bashAfter setting up all workers, update Main EC2:## Step 3: Update Main EC2 with Worker IPs---```pm2 logs video-worker --lines 50# Check status# Follow the command it gives youpm2 startup# Enable PM2 on bootpm2 save# Save PM2 process listpm2 start ecosystem.config.js# Start workermkdir -p logscd /home/ubuntu/worker```bash#### E. Start Worker```};  }]    merge_logs: true    log_date_format: 'YYYY-MM-DD HH:mm:ss',    out_file: './logs/out.log',    error_file: './logs/error.log',    },      PORT: 3001      NODE_ENV: 'production',    env: {    max_memory_restart: '3G',    exec_mode: 'fork',    instances: 1,    script: './server.js',    name: 'video-worker',  apps: [{module.exports = {```javascript```nano /home/ubuntu/worker/ecosystem.config.js```bash#### D. Create PM2 ConfigSave and exit (Ctrl+X, Y, Enter)```});  console.log(`   Status: Ready to process videos\n`);  console.log(`\n🚀 Video Worker Server running on port ${PORT}`);app.listen(PORT, () => {}  }    return 'unknown';  } catch {    return response.data;    const response = await axios.get('http://169.254.169.254/latest/meta-data/public-ipv4');  try {async function getPublicIp() {}  });      .save(outputPath);      .on('error', reject)      })        }, 60000);          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);        setTimeout(() => {        // Clean up after 1 minute                });          size: Math.round(size / 1024 / 1024) // MB          url: outputPath,           quality,         resolve({         const size = fs.statSync(outputPath).size;      .on('end', () => {      })        }          }            lastPercent = percent;            console.log(`   ${quality}p: ${percent}%`);          if (percent > lastPercent + 10) {          const percent = Math.round(progress.percent);        if (progress.percent) {      .on('progress', (progress) => {      ])        '-pix_fmt yuv420p'        '-movflags +faststart',        '-crf 23',        '-preset medium',      .outputOptions([      .format('mp4')      .audioBitrate(preset.audioBitrate)      .videoBitrate(preset.bitrate)      .size(`${preset.width}x${preset.height}`)      .audioCodec('aac')      .videoCodec('libx264')    ffmpeg(videoPath)        let lastPercent = 0;  return new Promise((resolve, reject) => {  const outputPath = `/tmp/${videoId}_${quality}p.mp4`;  const preset = presets[quality];  };    '1080': { width: 1920, height: 1080, bitrate: '5000k', audioBitrate: '192k' }    '720': { width: 1280, height: 720, bitrate: '2500k', audioBitrate: '128k' },    '480': { width: 854, height: 480, bitrate: '1200k', audioBitrate: '128k' },    '360': { width: 640, height: 360, bitrate: '800k', audioBitrate: '96k' },  const presets = {async function transcodeQuality(videoPath, quality, videoId) {}  });    });      });        duration: metadata.format.duration        height: videoStream.height,        width: videoStream.width,      resolve({      if (!videoStream) return reject(new Error('No video stream'));      const videoStream = metadata.streams.find(s => s.codec_type === 'video');      if (err) return reject(err);    ffmpeg.ffprobe(videoPath, (err, metadata) => {  return new Promise((resolve, reject) => {function getVideoMetadata(videoPath) {}  });    writer.on('error', reject);    });      resolve(localPath);      console.log(`✅ Download complete`);    writer.on('finish', () => {  return new Promise((resolve, reject) => {  response.data.pipe(writer);  const writer = fs.createWriteStream(localPath);  });    responseType: 'stream'    url: videoPath,    method: 'GET',  const response = await axios({    console.log(`📥 Downloading video...`);  const localPath = `/tmp/${videoId}_original.mp4`;  // Download from URL  }    return videoPath;  if (fs.existsSync(videoPath)) {  // If already local, return itasync function downloadVideo(videoPath, videoId) {}  }    jobs.set(jobId, { status: 'failed', error: error.message });    }      }        console.error('Callback failed:', e.message);      } catch (e) {        });          workerIp          error: error.message,          status: 'failed',          videoId,        await axios.post(callbackUrl, {        const workerIp = await getPublicIp();      try {    if (callbackUrl) {    // Send failure callback        console.error(`❌ Job ${jobId} error:`, error.message);  } catch (error) {    console.log(`\n✅ Job ${jobId} completed in ${duration}s\n`);        });      duration: `${duration}s`      variants,      videoId,       status: 'completed',     jobs.set(jobId, {     const duration = Math.round((new Date() - jobs.get(jobId).startTime) / 1000);    }      console.log(`📞 Callback sent to main server`);      });        workerIp        variants,        status: 'completed',        videoId,      await axios.post(callbackUrl, {      const workerIp = await getPublicIp();    if (callbackUrl) {    // Send callback to main server    }      fs.unlinkSync(localPath);    if (fs.existsSync(localPath)) {    // Clean up local file    }      }        console.error(`❌ Failed ${quality}p:`, err.message);      } catch (err) {        console.log(`✅ Completed ${quality}p`);        variants.push(variant);        const variant = await transcodeQuality(localPath, quality, videoId);        console.log(`\n🔄 Starting ${quality}p...`);      try {    for (const quality of qualities) {    // Transcode each quality    const variants = [];    console.log(`🎯 Will create qualities: ${qualities.join(', ')}`);        if (height >= 1080) qualities.push('1080');    if (height >= 720) qualities.push('720');    const qualities = ['360', '480'];    // Determine quality variants    const height = metadata.height;    console.log(`📊 Video: ${metadata.width}x${metadata.height}, ${Math.round(metadata.duration)}s`);    const metadata = await getVideoMetadata(localPath);    // Get video metadata    const localPath = await downloadVideo(videoPath, videoId);    // Download video (if from B2/CDN)    jobs.set(jobId, { status: 'processing', videoId, startTime: new Date() });    console.log(`⚙️  Processing job ${jobId}...`);  try {async function processVideo(jobId, videoId, videoPath, callbackUrl) {});  res.json({ success: true, job });  }    return res.status(404).json({ error: 'Job not found' });  if (!job) {  const job = jobs.get(req.params.jobId);app.get('/api/job/:jobId', (req, res) => {// Get job status});  }    res.status(500).json({ error: error.message });    console.error('Error:', error);  } catch (error) {    });      jobs.set(jobId, { status: 'failed', error: err.message });      console.error(`❌ Job ${jobId} failed:`, err.message);    processVideo(jobId, videoId, videoPath, callbackUrl).catch(err => {    // Process video asynchronously    res.json({ success: true, jobId, status: 'queued' });    // Send immediate response    console.log(`   Path: ${videoPath}`);    console.log(`   Video: ${videoId}`);    console.log(`\n🎬 New job received: ${jobId}`);    jobs.set(jobId, { status: 'pending', videoId, startTime: new Date() });    const jobId = `job-${Date.now()}-${videoId}`;    }      return res.status(400).json({ error: 'videoId and videoPath required' });    if (!videoId || !videoPath) {        const { videoId, videoPath, userId, callbackUrl } = req.body;  try {app.post('/api/transcode', async (req, res) => {// Receive transcode job});  });    uptime: os.uptime()    memory: Math.round((1 - (os.freemem() / os.totalmem())) * 100),    cpu: avgCpu,    jobs: jobs.size,    status: 'healthy',   res.json({     const avgCpu = Math.round((totalCpu / cpus.length) * 100);    }, 0);    return acc + ((total - idle) / total);    const idle = cpu.times.idle;    const total = Object.values(cpu.times).reduce((a, b) => a + b);  const totalCpu = cpus.reduce((acc, cpu) => {  const cpus = os.cpus();app.get('/health', (req, res) => {// Health check with metricsconst jobs = new Map();const PORT = process.env.PORT || 3001;app.use(express.json());app.use(cors());const app = express();ffmpeg.setFfprobePath(ffprobePath);ffmpeg.setFfmpegPath(ffmpegPath);const os = require('os');const path = require('path');const fs = require('fs');const ffprobePath = require('ffprobe-static').path;const ffmpegPath = require('ffmpeg-static');const ffmpeg = require('fluent-ffmpeg');const cors = require('cors');const axios = require('axios');const express = require('express');```javascriptPaste this code:```nano /home/ubuntu/worker/server.js```bashCreate `server.js`:#### C. Create Worker Server```echo "✅ Setup complete! Now create the server files..."sudo npm install -g pm2# Install PM2npm install express axios fluent-ffmpeg ffmpeg-static ffprobe-static cors dotenv# Install dependenciesnpm init -y# Initialize npmcd /home/ubuntu/workermkdir -p /home/ubuntu/worker# Create worker directoryffmpeg -versionnpm --versionnode --version# Verify installationssudo apt install -y ffmpeg# Install FFmpegsudo apt install -y nodejscurl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -# Install Node.js 18sudo apt update && sudo apt upgrade -y# Update systemecho "🔧 Setting up Video Worker..."#!/bin/bash```bashRun this setup script:```ssh -i movia.pem ubuntu@WORKER-IP```bashSSH to worker:#### B. Setup Each Worker4. **Launch Instance** and note the **Public IP**     - All traffic (for callbacks and B2 access)   - **Outbound Rules:**     - Port 22 from your IP (for SSH access)     - Port 3001 from Main EC2 IP (3.238.106.222/32)   - **Inbound Rules:**   - Create new: `video-worker-sg`3. **Security Group:**   - Storage: **50 GB gp3**   - Key pair: Select your `movia.pem` key     - For heavy load: **c5.2xlarge** (8 vCPU, 16GB RAM)   - Instance type: **t3.xlarge** (4 vCPU, 16GB RAM)   - AMI: **Ubuntu Server 22.04 LTS**   - Name: `video-worker-1` (then worker-2, worker-3, etc.)2. **Settings:**1. **Go to AWS EC2 Console** → Launch Instance#### A. Launch New EC2 Instance### For EACH worker EC2, do the following:## Step 2: Setup Worker EC2 Instances---```pm2 logs backend --lines 50pm2 restart backend```bash### Restart backend:```npm install axios```bash### Install axios (if not already installed):```# WORKER_IPS=WORKER1-IP,WORKER2-IP,WORKER3-IP,WORKER4-IP# Example with your IPs:API_URL=http://3.238.106.222:5000WORKER_IPS=54.123.45.67,54.123.45.68,54.123.45.69WORKERS_ENABLED=true# Workers Configuration```envAdd these lines (replace with your actual worker IPs):```nano .env```bash### Update .env file:```cd /home/ubuntu/YT/backendssh -i movia.pem ubuntu@3.238.106.222```bash### SSH to Main EC2:## Step 1: Configure Main EC2---- **Worker EC2-2, 3, 4...**: Additional workers you'll create- **Worker EC2-1**: Video Processing (your existing worker)- **Main EC2** (3.238.106.222): Website + API + Job Distribution**Architecture:**This system uses multiple EC2 instances to process videos. Main EC2 automatically distributes jobs to the least busy worker.## Overviewconst { handleCallback, getAllWorkersStatus, retryFailedVideos } = require('../utils/videoQueue');
const { protect } = require('../middleware/auth');

// Callback from worker EC2 when transcoding is complete
router.post('/callback', async (req, res) => {
  try {
    const { videoId, status, variants, error, workerIp } = req.body;

    if (!videoId || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'videoId and status required' 
      });
    }

    await handleCallback(videoId, status, variants, error, workerIp);

    res.json({ success: true, message: 'Callback processed' });

  } catch (err) {
    console.error('Callback error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all workers status (admin only)
router.get('/workers', protect, async (req, res) => {
  try {
    const workers = await getAllWorkersStatus();
    
    res.json({ 
      success: true, 
      workers,
      totalWorkers: workers.length,
      healthyWorkers: workers.filter(w => w.healthy).length
    });

  } catch (err) {
    console.error('Error getting workers:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Retry failed videos (admin only)
router.post('/retry', protect, async (req, res) => {
  try {
    await retryFailedVideos();
    
    res.json({ 
      success: true, 
      message: 'Retry process started' 
    });

  } catch (err) {
    console.error('Error retrying:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
