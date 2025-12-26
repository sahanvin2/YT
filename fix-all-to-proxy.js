require('dotenv').config();
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({}, { strict: false, collection: 'videos' });
const Video = mongoose.model('Video', videoSchema);

async function fixAllVideosToProxy() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all videos with HLS
    const videos = await Video.find({
      $or: [
        { hlsEnabled: true },
        { hlsUrl: { $exists: true, $ne: null } },
        { videoUrl: { $regex: /\.m3u8$/ } }
      ]
    });

    console.log(`Found ${videos.length} HLS videos to fix\n`);

    for (const video of videos) {
      const videoId = video._id.toString();
      const userId = video.user?.toString() || '694a6659e76444afd812aedb';
      
      // Create proxy URL
      const proxyUrl = `http://localhost:5000/api/hls/${userId}/${videoId}/master.m3u8`;
      
      await Video.findByIdAndUpdate(videoId, {
        $set: {
          hlsUrl: proxyUrl,
          videoUrl: proxyUrl,
          cdnUrl: proxyUrl,
          hlsEnabled: true,
          processingStatus: 'completed',
          processingError: null
        }
      });
      
      console.log(`✅ Fixed: ${video.title}`);
      console.log(`   URL: ${proxyUrl}\n`);
    }

    console.log(`\n✅ All ${videos.length} videos fixed with proxy URLs!`);
    console.log('🎯 Videos will now play without CORS errors!\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAllVideosToProxy();
