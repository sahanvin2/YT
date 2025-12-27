const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null
});

const hlsQueue = new Queue('hls-processing', { connection });

async function clearFailedJobs() {
  console.log('🧹 Clearing failed and stuck jobs...\n');
  
  try {
    // Get all failed jobs
    const failed = await hlsQueue.getFailed();
    console.log(`❌ Found ${failed.length} failed jobs`);
    
    // Get all active jobs (might be stuck)
    const active = await hlsQueue.getActive();
    console.log(`⚙️  Found ${active.length} active jobs`);
    
    // Get all waiting jobs
    const waiting = await hlsQueue.getWaiting();
    console.log(`⏳ Found ${waiting.length} waiting jobs`);
    
    // Remove failed jobs
    for (const job of failed) {
      console.log(`  Removing failed job ${job.id} (Video: ${job.data.videoId})`);
      await job.remove();
    }
    
    // Check active jobs for missing files
    for (const job of active) {
      const fs = require('fs');
      if (!fs.existsSync(job.data.localFilePath)) {
        console.log(`  Removing stuck job ${job.id} - file missing (Video: ${job.data.videoId})`);
        await job.moveToFailed(new Error('Source file not found'), false);
        await job.remove();
      }
    }
    
    // Check waiting jobs for missing files
    for (const job of waiting) {
      const fs = require('fs');
      if (!fs.existsSync(job.data.localFilePath)) {
        console.log(`  Removing waiting job ${job.id} - file missing (Video: ${job.data.videoId})`);
        await job.remove();
      }
    }
    
    console.log('\n✅ Queue cleaned successfully!');
    console.log('\n📊 Current queue status:');
    const counts = await hlsQueue.getJobCounts();
    console.log(counts);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.quit();
    process.exit(0);
  }
}

clearFailedJobs();
