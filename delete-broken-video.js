require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const videoSchema = new mongoose.Schema({}, { strict: false, collection: 'videos' });
const Video = mongoose.model('Video', videoSchema);

async function deleteBrokenVideo() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const videoId = '694d4e28fc74d50eb8d38f64';
    const video = await Video.findById(videoId);

    if (!video) {
      console.log('❌ Video not found');
      return;
    }

    console.log('📹 Deleting broken video:');
    console.log('   Title:', video.title);
    console.log('   Status:', video.processingStatus);
    console.log('   Duration:', Math.floor(video.duration / 60), 'minutes');

    // Delete local HLS files
    const hlsDir = path.join('D:', 'MERN', 'Movia', 'tmp', `hls_${videoId}`);
    if (fs.existsSync(hlsDir)) {
      console.log('\n🗑️  Deleting local HLS files...');
      fs.rmSync(hlsDir, { recursive: true, force: true });
      console.log('   ✅ Local files deleted');
    }

    // Delete from database
    await Video.findByIdAndDelete(videoId);
    console.log('   ✅ Video deleted from database');

    console.log('\n✅ Cleanup complete! Video removed.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

deleteBrokenVideo();
