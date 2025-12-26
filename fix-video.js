require('dotenv').config();
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({}, { strict: false, collection: 'videos' });
const Video = mongoose.model('Video', videoSchema);

async function fixVideo() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const videoId = '694d6151fa44f2d4eee68a0f';
    const userId = '694a6659e76444afd812aedb';
    
    const hlsUrl = `https://f005.backblazeb2.com/file/movia-prod/videos/${userId}/${videoId}/master.m3u8`;
    const cdnUrl = `https://Xclub.b-cdn.net/videos/${userId}/${videoId}/master.m3u8`;
    
    const updated = await Video.findByIdAndUpdate(videoId, {
      hlsUrl: cdnUrl,
      videoUrl: cdnUrl,
      processingStatus: 'completed',
      processingCompleted: new Date(),
      hlsEnabled: true,
      variants: [
        { quality: '720p', url: cdnUrl, resolution: '1280x720' },
        { quality: '480p', url: cdnUrl, resolution: '854x480' },
        { quality: '360p', url: cdnUrl, resolution: '640x360' },
        { quality: '240p', url: cdnUrl, resolution: '426x240' },
        { quality: '144p', url: cdnUrl, resolution: '256x144' }
      ]
    }, { new: true });
    
    console.log('✅ Video fixed!');
    console.log('Title:', updated.title);
    console.log('HLS URL:', updated.hlsUrl);
    console.log('Status:', updated.processingStatus);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixVideo();
