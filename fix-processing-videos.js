/**
 * Fix videos stuck in processing status
 * Changes them to 'completed' so they can be played directly from B2
 */

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function fixProcessingVideos() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const videosCollection = db.collection('videos');
    
    // Find videos stuck in processing or queued
    const stuckVideos = await videosCollection.find({
      processingStatus: { $in: ['processing', 'queued'] }
    }).toArray();
    
    console.log(`Found ${stuckVideos.length} videos stuck in processing/queued status`);
    
    if (stuckVideos.length > 0) {
      // Update them to completed status
      const result = await videosCollection.updateMany(
        { processingStatus: { $in: ['processing', 'queued'] } },
        {
          $set: {
            processingStatus: 'completed',
            isPublished: true,
            processingCompleted: new Date()
          },
          $unset: {
            processingError: 1
          }
        }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} videos to 'completed' status`);
      
      // List the fixed videos
      for (const video of stuckVideos) {
        console.log(`📹 Fixed: ${video.title} (${video._id})`);
        console.log(`   Video URL: ${video.videoUrl}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing videos:', error);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

// Run the fix
fixProcessingVideos().then(() => {
  console.log('✅ Processing video fix completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fix failed:', error);
  process.exit(1);
});