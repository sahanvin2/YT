// Requeue all non-HLS videos for HLS processing.
// Usage: node scripts/requeue_all_to_hls.js

require('dotenv').config();

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const Video = require('../backend/models/Video');
const { addToHLSQueue } = require('../backend/utils/hlsQueue');

function isAbsoluteHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

function isProxyOrPlaceholder(value) {
  if (typeof value !== 'string') return true;
  const v = value.trim();
  if (!v) return true;
  if (v.toLowerCase() === 'processing') return true;
  if (v.includes('/api/hls/')) return true;
  if (v.includes('.m3u8')) return true;
  return false;
}

async function downloadToTmp(sourceUrl, videoId) {
  const urlObj = new URL(sourceUrl);
  const ext = path.extname(urlObj.pathname) || '.mp4';

  const tmpDir = path.join(__dirname, '../tmp/reprocess');
  fs.mkdirSync(tmpDir, { recursive: true });

  const filePath = path.join(tmpDir, `reprocess_${videoId}_${Date.now()}${ext}`);

  const resp = await axios.get(sourceUrl, {
    responseType: 'stream',
    timeout: 600000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    validateStatus: () => true
  });

  if (!(resp.status >= 200 && resp.status < 300)) {
    throw new Error(`Download failed (${resp.status})`);
  }

  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(filePath);
    resp.data.pipe(out);
    out.on('finish', resolve);
    out.on('error', reject);
  });

  return filePath;
}

async function main() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('Missing MONGO_URI / MONGODB_URI in environment');
  }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const cursor = Video.find({
    $or: [
      { hlsUrl: { $exists: false } },
      { hlsUrl: null },
      { hlsUrl: '' }
    ]
  }).cursor();

  let queued = 0;
  let skipped = 0;
  let failed = 0;

  for await (const video of cursor) {
    const videoId = video._id.toString();
    const userId = (video.user && video.user._id) ? video.user._id.toString() : String(video.user);

    const sourceUrl = video.videoUrl || video.cdnUrl;

    if (!isAbsoluteHttpUrl(sourceUrl) || isProxyOrPlaceholder(sourceUrl)) {
      skipped++;
      continue;
    }

    try {
      await Video.findByIdAndUpdate(videoId, {
        processingStatus: 'queued',
        processingError: null,
        videoUrl: 'processing'
      });

      const localPath = await downloadToTmp(sourceUrl, videoId);
      await addToHLSQueue(videoId, localPath, userId);

      queued++;
      if (queued % 5 === 0) {
        console.log(`⏳ Queued ${queued} videos...`);
      }
    } catch (e) {
      failed++;
      await Video.findByIdAndUpdate(videoId, {
        processingStatus: 'failed',
        processingError: e.message
      });
      console.error(`❌ Failed for video ${videoId}: ${e.message}`);
    }
  }

  console.log('====================================================');
  console.log(`✅ Done. queued=${queued} skipped=${skipped} failed=${failed}`);
  console.log('====================================================');

  await mongoose.connection.close();
}

main().catch(async (e) => {
  console.error('❌ Script failed:', e);
  try {
    await mongoose.connection.close();
  } catch {}
  process.exit(1);
});
