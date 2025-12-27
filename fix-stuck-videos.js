/**
 * Fix videos stuck in "processing" status that are already completed in B2
 * This script checks if master.m3u8 exists in B2 and updates MongoDB status
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Video = require('./backend/models/Video');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/movia';
const B2_PUBLIC_BASE = process.env.B2_PUBLIC_BASE || 'https://f005.backblazeb2.com/file/movia-prod';

async function checkVideoInB2(userId, videoId) {
  try {
    const masterUrl = `${B2_PUBLIC_BASE}/hls/${userId}/${videoId}/master.m3u8`;
    const response = await axios.head(masterUrl, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function fixStuckVideos() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find videos stuck in processing/queued status
    const stuckVideos = await Video.find({
      processingStatus: { $in: ['processing', 'queued'] }
    }).select('_id title user hlsUrl videoUrl processingStatus createdAt');

    console.log(`📊 Found ${stuckVideos.length} videos in processing/queued status\n`);

    if (stuckVideos.length === 0) {
      console.log('✅ No stuck videos found!');
      process.exit(0);
    }

    let fixedCount = 0;
    let notFoundCount = 0;

    for (const video of stuckVideos) {
      const videoId = video._id.toString();
      const userId = video.user.toString();
      
      process.stdout.write(`🔍 Checking ${video.title} (${videoId})... `);

      // Check if video exists in B2
      const existsInB2 = await checkVideoInB2(userId, videoId);

      if (existsInB2) {
        // Video exists in B2, update status to completed
        const hlsUrl = `/api/hls/${userId}/${videoId}/master.m3u8`;
        
        await Video.findByIdAndUpdate(videoId, {
          processingStatus: 'completed',
          hlsUrl: hlsUrl,
          videoUrl: hlsUrl,
          isPublished: true
        });

        console.log('✅ FIXED - Video found in B2, status updated to completed');
        fixedCount++;
      } else {
        console.log('❌ NOT IN B2 - Video not found in bucket');
        notFoundCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total stuck videos: ${stuckVideos.length}`);
    console.log(`   ✅ Fixed: ${fixedCount}`);
    console.log(`   ❌ Not in B2: ${notFoundCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the fix
console.log('🚀 Starting video status fix...\n');
fixStuckVideos();
