require('dotenv').config();
const { Queue } = require('bullmq');
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({}, { strict: false, collection: 'videos' });
const Video = mongoose.model('Video', videoSchema);

async function resumeEncoding() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const videoId = '694d4e28fc74d50eb8d38f64';
    const video = await Video.findById(videoId);

    if (!video) {
      console.log('❌ Video not found');
      return;
    }

    console.log(`\n📹 Video: ${video.title}`);
    console.log(`   Status: ${video.processingStatus}`);
    console.log(`   Duration: ${Math.floor(video.duration / 60)} minutes ${video.duration % 60} seconds`);

    // Reset video status
    video.processingStatus = 'queued';
    video.videoUrl = 'processing';
    await video.save();

    console.log('\n🔄 Video status reset to "queued"');

    // Add to queue
    const hlsQueue = new Queue('hls-processing', {
      connection: {
        host: '127.0.0.1',
        port: 6379,
      },
    });

    const job = await hlsQueue.add('process-hls', {
      videoId: videoId,
      filePath: video.filePath,
      userId: video.user.toString(),
    });

    console.log(`✅ Job added to queue with ID: ${job.id}`);
    console.log('\n🎬 Encoding will resume shortly...');
    console.log('   Check "Movia HLS Worker" window for progress');

    await hlsQueue.close();
    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resumeEncoding();
