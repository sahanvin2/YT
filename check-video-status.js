const mongoose = require('mongoose');
require('dotenv').config();

const Video = require('./backend/models/Video');
const User = require('./backend/models/User');

async function checkVideo() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('✅ Connected to MongoDB\n');
  const videoId = '694eeed4c381b4269d3477da'; // From your screenshot
  
  console.log(`🔍 Checking video: ${videoId}\n`);
  
  try {
    const video = await Video.findById(videoId).populate('user', 'username');
    
    if (!video) {
      console.log('❌ Video not found in database!');
      return;
    }
    
    console.log('📹 Video Details:');
    console.log(`   Title: ${video.title}`);
    console.log(`   User: ${video.user?.username || 'Unknown'}`);
    console.log(`   Processing Status: ${video.processingStatus}`);
    console.log(`   Published: ${video.isPublished ? 'Yes' : 'No'}`);
    console.log(`   HLS URL: ${video.hlsUrl || 'NOT SET ❌'}`);
    console.log(`   Video URL: ${video.videoUrl}`);
    console.log(`   Duration: ${video.duration}s`);
    console.log(`   Created: ${video.createdAt}`);
    
    if (video.processingError) {
      console.log(`\n⚠️  Processing Error: ${video.processingError}`);
    }
    
    if (!video.hlsUrl) {
      console.log('\n❗ Problem: HLS URL is not set!');
      console.log('   This means the HLS processing never completed or failed to update the database.');
    }
    
    if (video.processingStatus !== 'completed') {
      console.log(`\n❗ Problem: Video status is "${video.processingStatus}" instead of "completed"`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkVideo();
