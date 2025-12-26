require('dotenv').config();
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({}, { strict: false, collection: 'videos' });
const Video = mongoose.model('Video', videoSchema);

async function fixAllStuckVideos() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fix first video - has HLS files
    const video1Id = '694d6151fa44f2d4eee68a0f';
    const userId = '694a6659e76444afd812aedb';
    
    const cdnUrl1 = `https://Xclub.b-cdn.net/videos/${userId}/${video1Id}/master.m3u8`;
    
    const updated1 = await Video.findByIdAndUpdate(video1Id, {
      hlsUrl: cdnUrl1,
      videoUrl: cdnUrl1,
      processingStatus: 'completed',
      processingCompleted: new Date(),
      hlsEnabled: true,
      processingError: null,
      variants: [
        { quality: '720p', url: cdnUrl1, resolution: '1280x720' },
        { quality: '480p', url: cdnUrl1, resolution: '854x480' },
        { quality: '360p', url: cdnUrl1, resolution: '640x360' },
        { quality: '240p', url: cdnUrl1, resolution: '426x240' },
        { quality: '144p', url: cdnUrl1, resolution: '256x144' }
      ]
    }, { new: true });
    
    console.log('✅ Video 1 fixed:', updated1.title);
    console.log('   Status:', updated1.processingStatus);
    console.log('   URL:', updated1.videoUrl);
    
    // Fix second video - mark as failed, needs re-upload
    const video2Id = '694d61cafa44f2d4eee68a23';
    
    const updated2 = await Video.findByIdAndUpdate(video2Id, {
      processingStatus: 'failed',
      processingError: 'Encoding never completed - please re-upload',
      videoUrl: 'failed'
    }, { new: true });
    
    console.log('\n⚠️  Video 2 marked as failed:', updated2.title);
    console.log('   Reason: No HLS files found on B2');
    console.log('   Action: User should re-upload this video');
    
    console.log('\n✅ All videos fixed!');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixAllStuckVideos();
