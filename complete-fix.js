require('dotenv').config();
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({}, { strict: false, collection: 'videos' });
const Video = mongoose.model('Video', videoSchema);

async function completelyFixVideos() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const userId = '694a6659e76444afd812aedb';
    
    // Video 1 - HAS HLS files on B2
    const video1Id = '694d6151fa44f2d4eee68a0f';
    const b2Url = `https://f005.backblazeb2.com/file/movia-prod/videos/${userId}/${video1Id}/master.m3u8`;
    
    console.log('Fixing Video 1...');
    const v1 = await Video.findByIdAndUpdate(video1Id, {
      $set: {
        hlsUrl: b2Url,
        videoUrl: b2Url,
        hlsEnabled: true,
        processingStatus: 'completed',
        processingCompleted: new Date(),
        processingError: null,
        duration: 1368, // 22 minutes 48 seconds
        variants: [
          { quality: '720p', url: b2Url, resolution: '1280x720' },
          { quality: '480p', url: b2Url, resolution: '854x480' },
          { quality: '360p', url: b2Url, resolution: '640x360' },
          { quality: '240p', url: b2Url, resolution: '426x240' },
          { quality: '144p', url: b2Url, resolution: '256x144' }
        ]
      }
    }, { new: true });
    
    console.log('✅ Video 1:', v1.title);
    console.log('   URL:', v1.videoUrl);
    console.log('   Status:', v1.processingStatus);
    console.log('   Test:', `http://localhost:3000/watch/${video1Id}`);
    
    // Video 2 - DELETE (no HLS files)
    const video2Id = '694d61cafa44f2d4eee68a23';
    console.log('\n🗑️  Deleting Video 2 (no HLS files)...');
    await Video.findByIdAndDelete(video2Id);
    console.log('✅ Video 2 deleted');
    
    console.log('\n✅ All fixed! Test Video 1 now!');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

completelyFixVideos();
