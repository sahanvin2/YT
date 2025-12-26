const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Import models and utils
const Video = require('./backend/models/Video');
const { addToHLSQueue } = require('./backend/utils/hlsQueue');

async function testUploadFlow() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check Redis connection by trying to add a test job
    const testVideoPath = path.join(__dirname, 'tmp', 'video_1766610674033.mkv');
    const fs = require('fs');
    
    if (!fs.existsSync(testVideoPath)) {
      console.log('❌ Test video not found:', testVideoPath);
      console.log('\n📝 Available videos in tmp:');
      const tmpFiles = fs.readdirSync(path.join(__dirname, 'tmp'))
        .filter(f => f.startsWith('video_'));
      tmpFiles.forEach(f => console.log('   -', f));
      
      if (tmpFiles.length > 0) {
        console.log(`\n💡 Use this test video: ${tmpFiles[0]}`);
      }
      process.exit(1);
    }

    console.log('✅ Test video file exists');
    
    // Create a test video record
    const testVideo = await Video.create({
      title: 'HLS Test Upload',
      description: 'Testing HLS queue system',
      videoUrl: 'processing',
      thumbnailUrl: '',
      duration: 100,
      category: 'test',
      tags: ['test'],
      visibility: 'private',
      user: '6921dd4e75b5b4597cbd59e7', // Use existing user ID
      processingStatus: 'queued'
    });

    console.log('✅ Test video record created:', testVideo._id);

    // Try to add to HLS queue
    await addToHLSQueue(testVideo._id.toString(), testVideoPath, '6921dd4e75b5b4597cbd59e7');
    console.log('✅ Video added to HLS queue successfully!');
    
    console.log('\n🎯 SUCCESS! Upload flow is working correctly.');
    console.log('📺 Check the HLS Worker terminal for processing logs.');
    console.log(`🔍 Video ID: ${testVideo._id}`);
    
    // Wait a bit to let the job be picked up
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testUploadFlow();
