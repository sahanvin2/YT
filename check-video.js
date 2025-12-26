require('dotenv').config();
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({}, { strict: false, collection: 'videos' });
const Video = mongoose.model('Video', videoSchema);

async function checkVideo() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const videoId = '694d4e28fc74d50eb8d38f64';
    const video = await Video.findById(videoId);

    if (!video) {
      console.log('❌ Video not found');
      return;
    }

    console.log('📹 Video Details:');
    console.log('   Title:', video.title);
    console.log('   Status:', video.processingStatus);
    console.log('   Video URL:', video.videoUrl);
    console.log('   Duration:', video.duration, 'seconds');
    console.log('   Created:', video.createdAt);
    console.log('\n🎬 HLS Processing:');
    console.log('   HLS Enabled:', video.hlsEnabled);
    console.log('   HLS URL:', video.hlsUrl);
    console.log('   HLS Variants:', video.hlsVariants);

    // Check if HLS files exist locally
    const fs = require('fs');
    const hlsDir = `D:\\MERN\\Movia\\tmp\\hls_${videoId}`;
    
    if (fs.existsSync(hlsDir)) {
      const files = fs.readdirSync(hlsDir, { recursive: true });
      console.log(`\n📁 Local HLS Files: ${files.length} files found`);
      
      // Count variants
      const variants = ['720p', '480p', '360p', '240p', '144p'];
      variants.forEach(variant => {
        const variantFiles = files.filter(f => f.includes(variant));
        console.log(`   ${variant}: ${variantFiles.length} files`);
      });
    } else {
      console.log('\n❌ No local HLS files found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkVideo();
