const mongoose = require('mongoose');
require('dotenv').config();

const Video = require('./backend/models/Video');
const User = require('./backend/models/User');

async function fixUnpublishedVideos() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('✅ Connected to MongoDB\n');
  
  try {
    // Find all completed videos that are not published
    const unpublishedVideos = await Video.find({
      processingStatus: 'completed',
      isPublished: false,
      hlsUrl: { $exists: true, $ne: null }
    });
    
    console.log(`🔍 Found ${unpublishedVideos.length} completed but unpublished videos:\n`);
    
    if (unpublishedVideos.length === 0) {
      console.log('✅ All completed videos are published!');
      return;
    }
    
    for (const video of unpublishedVideos) {
      console.log(`📹 ${video.title}`);
      console.log(`   ID: ${video._id}`);
      console.log(`   Status: ${video.processingStatus}`);
      console.log(`   HLS URL: ${video.hlsUrl ? '✅' : '❌'}`);
    }
    
    console.log('\n🔧 Publishing all these videos...\n');
    
    // Update all to published
    const result = await Video.updateMany(
      {
        processingStatus: 'completed',
        isPublished: false,
        hlsUrl: { $exists: true, $ne: null }
      },
      {
        $set: { isPublished: true }
      }
    );
    
    console.log(`✅ Published ${result.modifiedCount} videos!`);
    console.log('\n🎉 All completed videos are now visible on the website!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

fixUnpublishedVideos();
