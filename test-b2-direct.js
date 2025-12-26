require('dotenv').config();
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({}, { strict: false, collection: 'videos' });
const Video = mongoose.model('Video', videoSchema);

async function useB2DirectURL() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const videoId = '694d6151fa44f2d4eee68a0f';
    const userId = '694a6659e76444afd812aedb';
    
    // Use B2 direct URL instead of CDN
    const b2Url = `https://f005.backblazeb2.com/file/movia-prod/videos/${userId}/${videoId}/master.m3u8`;
    
    const updated = await Video.findByIdAndUpdate(videoId, {
      hlsUrl: b2Url,
      videoUrl: b2Url,
      cdnUrl: b2Url
    }, { new: true });
    
    console.log('✅ Video updated to use B2 direct URL');
    console.log('URL:', updated.videoUrl);
    console.log('\n🔗 Test: http://localhost:3000/watch/' + videoId);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

useB2DirectURL();
