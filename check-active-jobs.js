const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const fs = require('fs');

const connection = new IORedis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null
});

const hlsQueue = new Queue('hls-processing', { connection });

async function checkActiveJobs() {
  console.log('🔍 Checking active jobs...\n');
  
  try {
    const active = await hlsQueue.getActive();
    
    if (active.length === 0) {
      console.log('✅ No active jobs - system ready for new uploads!');
    } else {
      console.log(`⚙️  ${active.length} jobs currently processing:\n`);
      
      for (const job of active) {
        console.log(`📹 Video ID: ${job.data.videoId}`);
        console.log(`   User ID: ${job.data.userId}`);
        console.log(`   File: ${job.data.localFilePath}`);
        console.log(`   File exists: ${fs.existsSync(job.data.localFilePath) ? '✅' : '❌'}`);
        console.log(`   Started: ${new Date(job.processedOn || job.timestamp).toLocaleString()}`);
        console.log(`   Progress: ${job.progress}%`);
        console.log('');
      }
    }
    
    // Show queue stats
    const counts = await hlsQueue.getJobCounts();
    console.log('📊 Queue Status:');
    console.log(`   Active: ${counts.active}`);
    console.log(`   Waiting: ${counts.waiting}`);
    console.log(`   Completed: ${counts.completed}`);
    console.log(`   Failed: ${counts.failed}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.quit();
    process.exit(0);
  }
}

checkActiveJobs();
