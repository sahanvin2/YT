/**
 * Fix Orphaned HLS Videos
 * This script finds videos in B2/tmp that were processed but not in database
 * and adds them back to the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Video = require('./backend/models/Video');

const fixOrphanedVideos = async () => {
  try {
    console.log('\n🔧 Starting Orphaned Video Fix...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all videos in processing or queued state
    const processingVideos = await Video.find({
      processingStatus: { $in: ['processing', 'queued'] }
    }).select('_id title processingStatus user createdAt');

    console.log(`Found ${processingVideos.length} videos in processing/queued state\n`);

    if (processingVideos.length === 0) {
      console.log('✅ No orphaned videos found!');
      await mongoose.disconnect();
      return;
    }

    // Check which ones have HLS files in tmp
    const tmpDir = path.join(__dirname, 'tmp');
    let fixed = 0;
    let notFound = 0;

    console.log('Checking for HLS files...\n');
    console.log('─'.repeat(70));

    for (const video of processingVideos) {
      const videoId = video._id.toString();
      const userId = video.user.toString();
      
      // Check if HLS directory exists in tmp
      const hlsDir = path.join(tmpDir, `hls_${videoId}`);
      const masterPlaylist = path.join(hlsDir, 'master.m3u8');

      console.log(`\n📹 Video: ${video.title || videoId}`);
      console.log(`   ID: ${videoId}`);
      console.log(`   Status: ${video.processingStatus}`);
      console.log(`   Created: ${video.createdAt}`);

      if (fs.existsSync(masterPlaylist)) {
        console.log(`   ✅ HLS files found locally`);
        console.log(`   🔄 Updating database to completed status...`);

        try {
          const proxyUrl = `/api/hls/${userId}/${videoId}/master.m3u8`;
          
          await Video.findByIdAndUpdate(videoId, {
            hlsUrl: proxyUrl,
            videoUrl: proxyUrl,
            cdnUrl: proxyUrl,
            processingStatus: 'completed',
            processingCompleted: new Date(),
            processingError: null,
            hlsEnabled: true
          });

          console.log(`   ✅ Video marked as completed in database`);
          fixed++;
        } catch (updateError) {
          console.log(`   ❌ Failed to update: ${updateError.message}`);
        }
      } else {
        // Check if it's been processing for too long (> 2 hours)
        const ageHours = (Date.now() - video.createdAt.getTime()) / (1000 * 60 * 60);
        
        if (ageHours > 2) {
          console.log(`   ⚠️  No HLS files found and processing for ${ageHours.toFixed(1)} hours`);
          console.log(`   🔄 Marking as failed...`);

          try {
            await Video.findByIdAndUpdate(videoId, {
              processingStatus: 'failed',
              processingError: 'Processing timeout - no HLS files found after 2 hours'
            });
            console.log(`   ✅ Marked as failed`);
          } catch (updateError) {
            console.log(`   ❌ Failed to update: ${updateError.message}`);
          }
        } else {
          console.log(`   ⏳ Still processing (${ageHours.toFixed(1)} hours old)`);
        }
        
        notFound++;
      }
    }

    console.log('\n' + '─'.repeat(70));
    console.log('\n📊 SUMMARY:');
    console.log(`   Total checked: ${processingVideos.length}`);
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ❌ Not found: ${notFound}`);
    console.log();

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB\n');

    console.log('✅ Orphaned video fix completed!\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    
    process.exit(1);
  }
};

// Run the script
fixOrphanedVideos();
