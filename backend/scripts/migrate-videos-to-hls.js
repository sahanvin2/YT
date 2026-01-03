/**
 * Migration Script: Convert existing MP4/MKV videos to HLS format
 * 
 * This script:
 * 1. Finds all videos that are not in HLS format
 * 2. Downloads them from B2
 * 3. Adds them to the HLS processing queue
 * 4. Updates their status to 'queued'
 * 
 * Run: node backend/scripts/migrate-videos-to-hls.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Video = require('../models/Video');
const { addToHLSQueue } = require('../utils/hlsQueue');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const B2_BUCKET = process.env.B2_BUCKET;
const B2_ENDPOINT = process.env.B2_ENDPOINT;
const B2_ACCESS_KEY_ID = process.env.B2_ACCESS_KEY_ID;
const B2_SECRET_ACCESS_KEY = process.env.B2_SECRET_ACCESS_KEY;

const s3 = new S3Client({
  region: 'auto',
  endpoint: B2_ENDPOINT,
  credentials: {
    accessKeyId: B2_ACCESS_KEY_ID,
    secretAccessKey: B2_SECRET_ACCESS_KEY,
  },
});

function extractKeyFromUrl(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    // B2 URLs: https://f005.backblazeb2.com/file/bucket-name/path/to/file
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.findIndex(p => p && p !== 'file');
    if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
      return pathParts.slice(bucketIndex + 1).join('/');
    }
    return null;
  } catch (e) {
    return null;
  }
}

function isHlsUrl(url) {
  return url && (url.includes('.m3u8') || url.includes('/api/hls/'));
}

function isDirectVideo(url) {
  return url && (
    url.endsWith('.mp4') || url.endsWith('.mkv') || url.endsWith('.webm') ||
    url.endsWith('.avi') || url.endsWith('.mov') || url.endsWith('.flv')
  );
}

async function downloadVideoFromB2(videoKey, localPath) {
  try {
    const downloadStream = (await s3.send(new GetObjectCommand({
      Bucket: B2_BUCKET,
      Key: videoKey,
    }))).Body;
    
    const writeStream = fs.createWriteStream(localPath);
    await new Promise((resolve, reject) => {
      downloadStream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to download ${videoKey}:`, error.message);
    return false;
  }
}

async function migrateVideos() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find videos that need HLS conversion
    const videos = await Video.find({
      $or: [
        { hlsUrl: { $exists: false } },
        { hlsUrl: null },
        { hlsUrl: '' },
        { processingStatus: { $ne: 'completed' } }
      ],
      $and: [
        {
          $or: [
            { videoUrl: { $regex: /\.(mp4|mkv|webm|avi|mov|flv)$/i } },
            { cdnUrl: { $regex: /\.(mp4|mkv|webm|avi|mov|flv)$/i } }
          ]
        },
        { processingStatus: { $ne: 'failed' } }
      ]
    }).limit(100); // Process 100 at a time

    console.log(`\n📋 Found ${videos.length} videos to migrate to HLS\n`);

    if (videos.length === 0) {
      console.log('✅ No videos need migration');
      process.exit(0);
    }

    // Create temp directory
    const tmpDir = path.join(__dirname, '../../tmp/migration');
    fs.mkdirSync(tmpDir, { recursive: true });

    let successCount = 0;
    let errorCount = 0;

    for (const video of videos) {
      try {
        console.log(`\n🎬 Processing: ${video.title} (${video._id})`);
        
        // Get video URL
        const videoUrl = video.videoUrl || video.cdnUrl;
        if (!videoUrl) {
          console.log(`   ⚠️  No video URL found, skipping`);
          errorCount++;
          continue;
        }

        // Check if already HLS
        if (isHlsUrl(videoUrl)) {
          console.log(`   ✅ Already HLS format, skipping`);
          continue;
        }

        // Extract B2 key
        const videoKey = extractKeyFromUrl(videoUrl);
        if (!videoKey) {
          console.log(`   ⚠️  Could not extract B2 key from URL: ${videoUrl}`);
          errorCount++;
          continue;
        }

        // Download video
        const localPath = path.join(tmpDir, `migrate_${video._id}_${Date.now()}.mp4`);
        console.log(`   📥 Downloading from B2: ${videoKey}`);
        
        const downloaded = await downloadVideoFromB2(videoKey, localPath);
        if (!downloaded) {
          console.log(`   ❌ Download failed`);
          errorCount++;
          continue;
        }

        // Update video status
        await Video.findByIdAndUpdate(video._id, {
          processingStatus: 'queued',
          processingError: null
        });

        // Add to HLS queue
        try {
          const jobId = await addToHLSQueue(
            video._id.toString(),
            localPath,
            video.user.toString()
          );
          console.log(`   ✅ Added to queue (Job: ${jobId})`);
          successCount++;
        } catch (queueError) {
          console.error(`   ❌ Queue error:`, queueError.message);
          await Video.findByIdAndUpdate(video._id, {
            processingStatus: 'failed',
            processingError: `Migration queue error: ${queueError.message}`
          });
          // Clean up downloaded file
          try {
            if (fs.existsSync(localPath)) {
              fs.unlinkSync(localPath);
            }
          } catch (e) {
            // Ignore
          }
          errorCount++;
        }

      } catch (error) {
        console.error(`   ❌ Error processing video ${video._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Migration Complete`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Total: ${videos.length}`);
    console.log(`${'='.repeat(60)}\n`);

    // Clean up temp directory
    try {
      const files = fs.readdirSync(tmpDir);
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(tmpDir, file));
        } catch (e) {
          // Ignore
        }
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateVideos();

