require('dotenv').config();
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({}, { strict: false, collection: 'videos' });
const Video = mongoose.model('Video', videoSchema);

async function useProxyURL() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const videoId = '694d6151fa44f2d4eee68a0f';
    const userId = '694a6659e76444afd812aedb';
    
    // Use backend proxy URL - NO CORS issues!
    const proxyUrl = `http://localhost:5000/api/hls/${userId}/${videoId}/master.m3u8`;
    
    const updated = await Video.findByIdAndUpdate(videoId, {
      hlsUrl: proxyUrl,
      videoUrl: proxyUrl,
      cdnUrl: proxyUrl,
      hlsEnabled: true,
      processingStatus: 'completed'
    }, { new: true });
    
    console.log('✅ Video updated to use proxy URL (NO CORS!)');
    console.log('URL:', updated.videoUrl);
    console.log('\n🔗 Test now: http://localhost:3000/watch/' + videoId);
    console.log('\n✅ This will work because proxy adds CORS headers!');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

useProxyURL();
