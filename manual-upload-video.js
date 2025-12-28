/**
 * Manual Video Upload Script
 * Use this to manually add already-processed HLS videos to the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Video = require('./backend/models/Video');
const User = require('./backend/models/User');

async function manualUpload() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ===== CONFIGURATION =====
    // Fill in these details for your video:
    const videoConfig = {
      // Video metadata
      title: 'Your Video Title',
      description: 'Your video description',
      duration: 0, // Duration in seconds (e.g., 3600 for 1 hour)
      
      // CDN URLs (must already exist on B2/Bunny CDN)
      thumbnailUrl: 'https://Xclub.b-cdn.net/videos/VIDEO_ID/thumbnail.jpg',
      hlsMasterUrl: 'https://Xclub.b-cdn.net/videos/VIDEO_ID/master.m3u8',
      
      // Optional metadata
      tags: ['tag1', 'tag2'],
      category: 'Entertainment', // Options: Entertainment, Education, Gaming, Music, Sports, News, Technology, Other
      language: 'en',
      visibility: 'public', // Options: public, unlisted, private
      
      // User email (must exist in your database)
      uploaderEmail: 'your-email@example.com',
    };

    // Find the uploader
    const uploader = await User.findOne({ email: videoConfig.uploaderEmail });
    if (!uploader) {
      throw new Error(`User not found: ${videoConfig.uploaderEmail}`);
    }
    console.log(`✅ Found uploader: ${uploader.username}`);

    // Create the video document
    const video = new Video({
      title: videoConfig.title,
      description: videoConfig.description,
      thumbnailUrl: videoConfig.thumbnailUrl,
      hlsMasterUrl: videoConfig.hlsMasterUrl,
      duration: videoConfig.duration,
      uploader: uploader._id,
      uploadDate: new Date(),
      status: 'published',
      processingStatus: 'completed',
      format: 'hls',
      views: 0,
      likes: [],
      dislikes: [],
      comments: [],
      tags: videoConfig.tags,
      category: videoConfig.category,
      language: videoConfig.language,
      visibility: videoConfig.visibility,
      allowComments: true,
      isAgeRestricted: false,
    });

    await video.save();
    console.log('✅ Video created successfully!');
    console.log(`📹 Video ID: ${video._id}`);
    console.log(`🔗 Watch at: http://localhost:3000/watch/${video._id}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

manualUpload();
