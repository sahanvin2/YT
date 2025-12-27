require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const Video = require('./backend/models/Video');

/**
 * Check for broken videos with missing HLS files
 * and mark them for reprocessing
 */

async function checkAndFixBrokenVideos() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all videos that are marked as completed but may have issues
    const videos = await Video.find({
      processingStatus: 'completed',
      hlsEnabled: true
    }).select('_id title hlsUrl cdnUrl user processingCompleted variants');

    console.log(`📊 Found ${videos.length} completed HLS videos\n`);

    const brokenVideos = [];
    const workingVideos = [];

    for (const video of videos) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📹 Checking: ${video.title}`);
      console.log(`   ID: ${video._id}`);
      console.log(`   HLS URL: ${video.hlsUrl || 'N/A'}`);
      console.log(`   Variants: ${video.variants?.length || 0}`);

      let isBroken = false;
      const issues = [];

      // Check 1: Has HLS URL?
      if (!video.hlsUrl && !video.cdnUrl) {
        issues.push('❌ No HLS URL');
        isBroken = true;
      }

      // Check 2: Has variants?
      if (!video.variants || video.variants.length === 0) {
        issues.push('❌ No quality variants');
        isBroken = true;
      }

      // Check 3: Try to fetch master playlist (only if it's a CDN/B2 URL)
      if (video.cdnUrl && (video.cdnUrl.startsWith('http://') || video.cdnUrl.startsWith('https://'))) {
        try {
          const response = await axios.head(video.cdnUrl, { timeout: 5000 });
          if (response.status !== 200) {
            issues.push(`❌ Master playlist HTTP ${response.status}`);
            isBroken = true;
          }
        } catch (error) {
          issues.push(`❌ Master playlist unreachable: ${error.message}`);
          isBroken = true;
        }
      }

      if (isBroken) {
        console.log('   🔴 BROKEN:');
        issues.forEach(issue => console.log(`      ${issue}`));
        brokenVideos.push({
          _id: video._id,
          title: video.title,
          issues
        });
      } else {
        console.log('   ✅ Working');
        workingVideos.push(video._id);
      }
    }

    console.log(`\n\n${'='.repeat(60)}`);
    console.log('📊 SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Working videos: ${workingVideos.length}`);
    console.log(`🔴 Broken videos: ${brokenVideos.length}`);

    if (brokenVideos.length > 0) {
      console.log(`\n🔴 BROKEN VIDEOS:`);
      brokenVideos.forEach(v => {
        console.log(`\n   • ${v.title} (ID: ${v._id})`);
        v.issues.forEach(issue => console.log(`     ${issue}`));
      });

      console.log(`\n\n💡 FIX OPTIONS:`);
      console.log(`\n1️⃣  DELETE broken videos:`);
      console.log(`   node delete-broken-video.js <video-id>`);
      
      console.log(`\n2️⃣  REPROCESS broken videos:`);
      console.log(`   Mark them as 'pending' and HLS worker will reprocess:`);
      console.log(`   `);
      console.log(`   In MongoDB:`);
      console.log(`   db.videos.updateMany(`);
      console.log(`     { _id: { $in: [ObjectId("..."), ...] } },`);
      console.log(`     { $set: { processingStatus: 'pending', hlsEnabled: false } }`);
      console.log(`   )`);

      console.log(`\n3️⃣  MANUAL FIX:`);
      console.log(`   - Re-upload the video`);
      console.log(`   - Delete old broken one`);
    }

    console.log('\n✅ Check complete');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAndFixBrokenVideos();
