const mongoose = require('mongoose');
require('dotenv').config();

const Video = require('./backend/models/Video');
const User = require('./backend/models/User');

async function checkAllVideos() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('✅ Connected to MongoDB\n');
  
  // Video IDs from your B2 screenshot
  const videoIds = [
    '694eeed4c381b4269d3477da',
    '694ef842f39fd6f3f80bad48',
    '694ef8e0f39fd6f3f80bafbe',
    '694efa1af39fd6f3f80bb450'
  ];
  
  console.log('🔍 Checking videos from B2:\n');
  
  for (const videoId of videoIds) {
    try {
      const video = await Video.findById(videoId);
      
      if (!video) {
        console.log(`❌ ${videoId} - NOT FOUND in database\n`);
        continue;
      }
      
      console.log(`📹 ${video.title || 'Untitled'}`);
      console.log(`   ID: ${videoId}`);
      console.log(`   Status: ${video.processingStatus}`);
      console.log(`   Published: ${video.isPublished ? '✅ Yes' : '❌ No'}`);
      console.log(`   HLS URL: ${video.hlsUrl || '❌ NOT SET'}`);
      console.log(`   Duration: ${video.duration}s`);
      console.log(`   Can Play: ${video.processingStatus === 'completed' && video.isPublished ? '✅ YES' : '❌ NO'}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Error checking ${videoId}:`, error.message);
    }
  }
  
  await mongoose.connection.close();
  process.exit(0);
}

checkAllVideos();
